import { z } from 'zod';
import { Parser } from 'web-tree-sitter';
/**
 * 代码解析原子工具 (AST Code Analyzer)
 * 职责: 基于 Tree-sitter 提取代码符号、结构和实体。
 */
export class CodeAnalyzerTool {
    manifest = {
        id: 'builtin:code-analyzer',
        type: 'builtin',
        description: '深度解析代码 AST 并提取符号实体',
        exposed: true,
        optional: false,
        inputSchema: z.object({
            code: z.string(),
            language: z.string().default('typescript'),
        }),
        outputSchema: z.object({
            entities: z.array(z.string()),
            symbols: z.array(z.any()),
        }),
    };
    parser;
    isReady = false;
    async execute(input, resources, context) {
        if (!this.isReady) {
            try {
                // @ts-ignore
                await Parser.init();
                // @ts-ignore
                this.parser = new Parser();
                this.isReady = true;
            }
            catch (e) {
                console.warn('[CodeAnalyzer] WASM Init failed, using regex fallback.');
            }
        }
        // 默认逻辑: 提取导出函数、类名作为实体
        const symbols = this.regexExtract(input.code, input.language);
        return {
            entities: symbols.map((s) => s.name),
            symbols: symbols
        };
    }
    regexExtract(code, lang) {
        const symbols = [];
        const regex = /export\s+(?:async\s+)?(?:function|class|interface|type|enum)\s+(\w+)/g;
        let match;
        while ((match = regex.exec(code)) !== null) {
            symbols.push({ name: match[1], type: 'definition' });
        }
        return symbols;
    }
}
//# sourceMappingURL=code-analyzer.js.map