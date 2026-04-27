type AnyTable = {
  add: (rows: Array<Record<string, unknown>>) => Promise<unknown>;
  schema?: unknown;
};

export type AddCompatResult = {
  removed_fields: string[];
  used_schema_filter: boolean;
  attempts: number;
};

function asErrorMessage(error: unknown): string {
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const anyErr = error as any;
    if (typeof anyErr.message === "string") return anyErr.message;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

async function resolveMaybePromise<T>(value: T | Promise<T>): Promise<T> {
  return await value;
}

async function tryGetTableFieldNames(
  table: AnyTable,
): Promise<Set<string> | null> {
  const schemaCandidate = (table as any)?.schema;
  if (!schemaCandidate) return null;

  let schema: any = schemaCandidate;
  try {
    if (typeof schemaCandidate === "function") {
      schema = await resolveMaybePromise(schemaCandidate.call(table));
    }
  } catch {
    return null;
  }

  const fields: any[] | undefined =
    (schema && Array.isArray(schema.fields) ? schema.fields : undefined) ??
    (schema && Array.isArray(schema.schema?.fields)
      ? schema.schema.fields
      : undefined);

  if (!fields || fields.length === 0) return null;

  const names = new Set<string>();
  for (const f of fields) {
    const n = (f && typeof f.name === "string" ? f.name : null) ?? null;
    if (n) names.add(n);
  }

  return names.size > 0 ? names : null;
}

function filterRowByAllowList(
  row: Record<string, unknown>,
  allowList: Set<string>,
): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (allowList.has(k)) filtered[k] = v;
  }
  return filtered;
}

function extractUnknownFieldsFromError(error: unknown): Set<string> {
  const message = asErrorMessage(error);
  const fields = new Set<string>();

  const patterns: RegExp[] = [
    /Schema does not contain field ['"`]([^'"`]+)['"`]/gi,
    /schema.*does not contain.*field ['"`]([^'"`]+)['"`]/gi,
    /field ['"`]([^'"`]+)['"`].*(?:not found|does not exist|not in schema)/gi,
    /unknown field(?:s)?[:\s]+['"`]?([a-zA-Z0-9_]+)['"`]?/gi,
    /column ['"`]([^'"`]+)['"`].*(?:not found|does not exist)/gi,
    /No such field:?\s*['"`]?([a-zA-Z0-9_]+)['"`]?/gi,
  ];

  for (const pattern of patterns) {
    while (true) {
      const match = pattern.exec(message);
      if (!match) break;
      const fieldName = String(match[1] ?? "").trim();
      if (fieldName) fields.add(fieldName);
    }
  }

  return fields;
}

export async function addRowsWithSchemaCompatibility(
  table: AnyTable,
  rows: Array<Record<string, unknown>>,
  options?: { max_retries?: number },
): Promise<AddCompatResult> {
  const { max_retries = 10 } = options ?? {};

  const copiedRows = rows.map((r) => ({ ...r }));
  const schemaFields = await tryGetTableFieldNames(table);
  const usedSchemaFilter = Boolean(schemaFields && schemaFields.size > 0);

  let workingRows = copiedRows;
  if (schemaFields) {
    workingRows = copiedRows.map((r) => filterRowByAllowList(r, schemaFields));
  }

  const removed = new Set<string>();
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= max_retries; attempt += 1) {
    try {
      await table.add(workingRows);
      return {
        removed_fields: Array.from(removed),
        used_schema_filter: usedSchemaFilter,
        attempts: attempt + 1,
      };
    } catch (error) {
      lastError = error;
      const unknownFields = extractUnknownFieldsFromError(error);

      if (unknownFields.size === 0) throw error;

      let changed = false;
      for (const f of unknownFields) {
        if (removed.has(f)) continue;
        removed.add(f);
        changed = true;
        for (const row of workingRows) {
          delete (row as any)[f];
        }
      }

      if (!changed) throw error;
    }
  }

  throw lastError;
}
