# 🚀 快速开始指南 (v1.0.0)

本指南将帮助您在 5 分钟内启动 MemoHub 并开始您的记忆编排之旅。

## 🛠️ 环境准备

### 1. 安装 Bun (运行时)
MemoHub 深度依赖 Bun 引擎提供高性能的源码执行与包管理。
```bash
curl -fsSL https://bun.sh/install | sh
```

### 2. 安装并启动 Ollama (向量嵌入)
默认使用本地模型 `nomic-embed-text-v2-moe`。
```bash
ollama pull nomic-embed-text-v2-moe
ollama serve
```

---

## 📦 安装与构建

```bash
# 1. 克隆仓库
git clone https://github.com/embaobao/memo-hub.git
cd memo-hub

# 2. 安装依赖并构建
bun install
bun run build
```

---

## 🖥️ 启动 Web 控制台 (推荐)

MemoHub 提供了一个极致简约、功能强大的可视化管理界面。

```bash
bun apps/cli/src/index.ts ui
```
访问 **`http://localhost:3000`** 即可进入控制台：
- **Studio**: 拖拽原子工具（CAS, Vector）构建您的记忆轨道逻辑。
- **Sandbox**: 直接与您的 Agent 对话，观察其如何检索并引用记忆。
- **Matrix**: 像浏览文件一样管理您的所有记忆碎片。

---

## ⌨️ 命令行交互

如果您更喜欢终端操作，MemoHub 提供了一套完整的指令集：

### 1. 注入记忆 (Add)
```bash
bun apps/cli/src/index.ts add "用户喜欢极简设计风格" -t track-insight
```

### 2. 语义搜索 (Search)
```bash
bun apps/cli/src/index.ts search "用户的设计偏好是什么？"
```

### 3. 查看状态 (Inspect)
```bash
bun apps/cli/src/index.ts inspect
```

### 4. MCP 模式
将 MemoHub 挂载为 MCP 服务器，供 Claude Desktop 使用：
```bash
bun apps/cli/src/index.ts mcp
```

---

## ⚙️ 配置文件

核心配置文件位于 `~/.memohub/config.jsonc`。
您可以定义 AI 供应商、向量维度、以及自定义的 Flow 编排逻辑。

```jsonc
{
  "system": { "root": "~/.memohub" },
  "ai": {
    "providers": {
      "ollama": { "baseURL": "http://localhost:11434/v1" }
    }
  },
  "tracks": [
    {
      "id": "track-insight",
      "flows": {
        "ADD": [
          { "step": "extract", "tool": "builtin:entity-linker" },
          { "step": "save", "tool": "builtin:vector" }
        ]
      }
    }
  ]
}
```

---

## 💡 下一步建议

- 深入了解 [Text2Mem 协议](../architecture/text2mem-protocol.md)。
- 学习如何 [开发自定义轨道](../development/contributing.md)。
- 探索 [存储架构](../architecture/storage.md) 的“灵肉分离”设计。

---

**MemoHub: 让记忆可被编排。**
