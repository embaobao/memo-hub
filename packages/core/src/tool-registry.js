/**
 * 原子工具注册中心
 */
export class ToolRegistry {
    tools = new Map();
    /**
     * 注册工具节点
     */
    register(tool) {
        this.tools.set(tool.manifest.id, tool);
    }
    /**
     * 获取工具 (支持简写，如 "cas" 匹配 "builtin:cas")
     */
    get(id) {
        if (this.tools.has(id))
            return this.tools.get(id);
        const builtinId = `builtin:${id}`;
        if (this.tools.has(builtinId))
            return this.tools.get(builtinId);
        throw new Error(`[ToolRegistry] 找不到工具节点: ${id}`);
    }
    /**
     * 列出所有已加载节点
     */
    list() {
        return Array.from(this.tools.values());
    }
    /**
     * 动态加载配置中定义的扩展工具 (TBD)
     */
    async loadExtensions(configs) {
        // 这里的逻辑将支持从 npm 或 本地路径动态加载
    }
}
//# sourceMappingURL=tool-registry.js.map