import { z } from 'zod';
export class CasTool {
    manifest = {
        id: 'builtin:cas',
        type: 'builtin',
        exposed: true,
        optional: false,
        inputSchema: z.object({
            content: z.string().min(1),
        }),
        outputSchema: z.object({
            hash: z.string(),
            path: z.string(),
        }),
    };
    async execute(input, resources, context) {
        const hash = await resources.flesh.write(input.content);
        // @ts-ignore - blobPath might be internal but we know it exists in this implementation
        const path = resources.flesh.blobPath ? resources.flesh.blobPath(hash) : hash;
        return { hash, path };
    }
}
//# sourceMappingURL=cas.js.map