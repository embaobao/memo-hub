/**
 * LanceDB 写入兼容工具
 *
 * 背景：
 * - MemoHub 的表 schema 会随着版本演进新增字段（如 access_count / entities / hash / content_ref 等）
 * - 但用户本地可能已经存在“旧 schema 的老表”（没有这些新字段）
 * - LanceDB 在写入包含“表 schema 不认识的字段”时会直接抛错，导致写入链路（例如 librarian ingest-git）中断
 *
 * 目标：
 * - 通用化兼容策略：尽最大努力写入，不因为“老表缺字段”而失败
 * - 优先使用表 schema 做白名单过滤；若运行期拿不到 schema，则退化为“按错误提示剔除字段并重试”
 *
 * 重要说明：
 * - 这里只处理“多余字段”导致的 schema mismatch；
 * - 若是“必填字段缺失 / 类型不匹配 / 其它底层错误”，应直接抛出，避免吞掉真实问题。
 */

type AnyTable = {
  add: (rows: Array<Record<string, unknown>>) => Promise<unknown>;
  schema?: unknown;
};

type AddCompatResult = {
  removed_fields: string[];
  used_schema_filter: boolean;
  attempts: number;
};

function asErrorMessage(error: unknown): string {
  if (typeof error === "string") {
    return error;
  }
  if (error && typeof error === "object") {
    const anyErr = error as any;
    if (typeof anyErr.message === "string") {
      return anyErr.message;
    }
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

/**
 * 尝试从 LanceDB Table 实例中提取字段名集合。
 *
 * 兼容性考虑：
 * - 不同版本的 @lancedb/lancedb 可能暴露不同形态的 schema（属性/方法/Arrow Schema 对象）
 * - 我们只做“尽力而为”的字段名提取，失败则返回 null，交给错误驱动剔除策略兜底
 */
async function tryGetTableFieldNames(table: AnyTable): Promise<Set<string> | null> {
  const schemaCandidate = (table as any)?.schema;
  if (!schemaCandidate) {
    return null;
  }

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
    (schema && Array.isArray(schema.schema?.fields) ? schema.schema.fields : undefined);

  if (!fields || fields.length === 0) {
    return null;
  }

  const names = new Set<string>();
  for (const f of fields) {
    const n = (f && typeof f.name === "string" ? f.name : null) ?? null;
    if (n) {
      names.add(n);
    }
  }

  return names.size > 0 ? names : null;
}

function filterRowByAllowList(
  row: Record<string, unknown>,
  allowList: Set<string>
): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (allowList.has(k)) {
      filtered[k] = v;
    }
  }
  return filtered;
}

/**
 * 从异常信息中抽取“未知字段名”。
 *
 * 这里故意用多个正则做覆盖（不同平台/不同 LanceDB 版本报错格式可能不同）。
 * 若无法抽取，则返回空集合，让上层把错误抛出（避免吞掉非 schema 类错误）。
 */
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
      if (!match) {
        break;
      }
      const fieldName = String(match[1] ?? "").trim();
      if (fieldName) {
        fields.add(fieldName);
      }
    }
  }

  return fields;
}

/**
 * 通用写入兼容：按 schema 过滤 + 异常驱动剔除未知字段重试。
 *
 * 使用方式：
 * - 你只要把“新版本要写入的完整 row”传进来即可
 * - 函数会尽力让写入在旧表上也能成功（把旧表没有的字段自动去掉）
 */
export async function addRowsWithSchemaCompatibility(
  table: AnyTable,
  rows: Array<Record<string, unknown>>,
  options?: {
    max_retries?: number;
  }
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

      if (unknownFields.size === 0) {
        throw error;
      }

      let changed = false;
      for (const f of unknownFields) {
        if (removed.has(f)) {
          continue;
        }
        removed.add(f);
        changed = true;
        for (const row of workingRows) {
          delete (row as any)[f];
        }
      }

      if (!changed) {
        throw error;
      }
    }
  }

  throw lastError;
}
