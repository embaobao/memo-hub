import type { Text2MemInstruction, Text2MemResult, IKernel, ITrackProvider } from '@memohub/protocol';
import { MemoOp } from '@memohub/protocol';

export class SourceTrack implements ITrackProvider {
  id = 'track-source';
  name = 'Source Track';

  private kernel!: IKernel;

  async initialize(kernel: IKernel): Promise<void> {
    this.kernel = kernel;
  }

  async execute(instruction: Text2MemInstruction): Promise<Text2MemResult> {
    switch (instruction.op) {
      case MemoOp.ADD:
        return this.handleAdd(instruction);
      case MemoOp.RETRIEVE:
        return this.handleRetrieve(instruction);
      case MemoOp.DELETE:
        return this.handleDelete(instruction);
      case MemoOp.LIST:
        return this.handleList(instruction);
      default:
        return { success: false, error: `Operation ${instruction.op} not supported by track-source` };
    }
  }

  private extractSymbols(code: string, language: string, filePath: string): Array<{
    symbol_name: string;
    ast_type: string;
    parent_symbol: string | null;
    text: string;
  }> {
    const symbols: Array<{
      symbol_name: string;
      ast_type: string;
      parent_symbol: string | null;
      text: string;
    }> = [];

    const patterns: Record<string, RegExp[]> = {
      typescript: [
        /export\s+(?:async\s+)?function\s+(\w+)/g,
        /(?:async\s+)?function\s+(\w+)/g,
        /export\s+(?:default\s+)?(?:class|interface|type|enum)\s+(\w+)/g,
        /(?:class|interface|type|enum)\s+(\w+)/g,
        /export\s+(?:const|let|var)\s+(\w+)/g,
      ],
      javascript: [
        /export\s+(?:async\s+)?function\s+(\w+)/g,
        /(?:async\s+)?function\s+(\w+)/g,
        /export\s+(?:default\s+)?class\s+(\w+)/g,
        /class\s+(\w+)/g,
        /export\s+(?:const|let|var)\s+(\w+)/g,
      ],
    };

    const lang = language === 'typescript' ? 'typescript' : 'javascript';
    const regexes = patterns[lang] ?? patterns.javascript;

    for (const regex of regexes) {
      let match;
      while ((match = regex.exec(code)) !== null) {
        const name = match[1];
        const type = this.inferAstType(match[0]);
        if (!symbols.some((s) => s.symbol_name === name)) {
          symbols.push({
            symbol_name: name,
            ast_type: type,
            parent_symbol: null,
            text: this.extractBlock(code, match.index),
          });
        }
      }
    }

    return symbols;
  }

  private inferAstType(declaration: string): string {
    if (/function/.test(declaration)) return 'function';
    if (/class/.test(declaration)) return 'class';
    if (/interface/.test(declaration)) return 'interface';
    if (/type\s/.test(declaration)) return 'type';
    if (/enum/.test(declaration)) return 'enum';
    return 'variable';
  }

  private extractBlock(code: string, startIndex: number): string {
    let braceCount = 0;
    let inBlock = false;
    let blockStart = startIndex;

    for (let i = startIndex; i < code.length; i++) {
      if (code[i] === '{') {
        if (!inBlock) blockStart = i;
        braceCount++;
        inBlock = true;
      } else if (code[i] === '}') {
        braceCount--;
        if (braceCount === 0 && inBlock) {
          return code.slice(startIndex, i + 1);
        }
      }
    }

    const lineEnd = code.indexOf('\n', startIndex);
    return lineEnd === -1 ? code.slice(startIndex) : code.slice(startIndex, lineEnd);
  }

  private async handleAdd(inst: Text2MemInstruction): Promise<Text2MemResult> {
    try {
      const { code, language = 'typescript', file_path = '', importance = 0.5, tags = [] } = inst.payload ?? {};
      if (!code) return { success: false, error: 'payload.code is required' };

      const cas = this.kernel.getCAS();
      const embedder = this.kernel.getEmbedder();
      const storage = this.kernel.getVectorStorage();

      const symbols = this.extractSymbols(code, language, file_path);
      if (symbols.length === 0) {
        const hash = await cas.write(code);
        const vector = await embedder.embed(code);
        const id = `source-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        await storage.add({
          id, vector, hash, track_id: this.id, entities: [],
          language, ast_type: 'unknown', symbol_name: '', file_path, importance, tags,
          source: inst.context?.source ?? 'cli',
          timestamp: new Date().toISOString(),
          access_count: 0,
          last_accessed: new Date().toISOString(),
        });
        return { success: true, data: [{ id, hash, symbol_name: '', ast_type: 'unknown' }] };
      }

      const results = [];
      for (const sym of symbols) {
        const hash = await cas.write(sym.text);
        const vector = await embedder.embed(sym.text);
        const id = `source-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        await storage.add({
          id, vector, hash, track_id: this.id,
          entities: [sym.symbol_name],
          language, ast_type: sym.ast_type, symbol_name: sym.symbol_name, parent_symbol: sym.parent_symbol, file_path, importance, tags,
          source: inst.context?.source ?? 'cli',
          timestamp: new Date().toISOString(),
          access_count: 0,
          last_accessed: new Date().toISOString(),
        });
        results.push({ id, hash, symbol_name: sym.symbol_name, ast_type: sym.ast_type });
      }

      return { success: true, data: results };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  private async handleRetrieve(inst: Text2MemInstruction): Promise<Text2MemResult> {
    try {
      const { query, limit = 5, filters } = inst.payload ?? {};
      if (!query) return { success: false, error: 'payload.query is required' };

      const embedder = this.kernel.getEmbedder();
      const storage = this.kernel.getVectorStorage();
      const cas = this.kernel.getCAS();

      const vector = await embedder.embed(query);
      let filterParts = [`track_id = '${this.id}'`];

      if (filters?.language) filterParts.push(`metadata.language = '${filters.language}'`);
      if (filters?.ast_type) filterParts.push(`metadata.ast_type = '${filters.ast_type}'`);

      const results = await storage.search(vector, { limit, filter: filterParts.join(' AND ') });

      const hydrated = await Promise.all(
        results.map(async (r) => {
          const content = await cas.read(r.hash).catch(() => '');
          return { ...r, text: content };
        }),
      );

      return { success: true, data: hydrated };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  private async handleDelete(inst: Text2MemInstruction): Promise<Text2MemResult> {
    try {
      const { symbol_name } = inst.payload ?? {};
      if (!symbol_name) return { success: false, error: 'payload.symbol_name is required' };

      await this.kernel.getVectorStorage().delete(`track_id = '${this.id}' AND metadata.symbol_name = '${symbol_name}'`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  private async handleList(inst: Text2MemInstruction): Promise<Text2MemResult> {
    try {
      const { ast_type } = inst.payload ?? {};
      const storage = this.kernel.getVectorStorage();
      let filter = `track_id = '${this.id}'`;
      if (ast_type) filter += ` AND metadata.ast_type = '${ast_type}'`;

      const records = await storage.list(filter);
      const symbols = records.map((r) => ({
        symbol_name: r.metadata?.symbol_name ?? '',
        ast_type: r.metadata?.ast_type ?? 'unknown',
        file_path: r.metadata?.file_path ?? '',
      }));

      return { success: true, data: symbols };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
}
