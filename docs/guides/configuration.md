# Configuration Guide (v1.0.0)

MemoHub 的所有行为均由 `config.jsonc` 驱动。该文件不仅定义了存储路径，还通过 **Flow-Driven 架构** 定义了每个操作的原子执行链。

---

## 📂 路径说明
- **全局配置**: `~/.memohub/config.jsonc`
- **项目配置**: `./.memohub/config.jsonc` (覆盖全局)

---

## 🛠️ 核心配置块

### 1. System (核心系统)
```jsonc
"system": {
  "root": "~/.memohub",   // 所有数据存放的物理根目录
  "port": 3000            // Web UI 与 API 监听端口
}
```

### 2. AI Providers (AI 供应商)
您可以自由切换 Ollama (本地) 或 OpenAI (云端)。
```jsonc
"ai": {
  "providers": {
    "ollama": {
      "baseURL": "http://localhost:11434/v1",
      "model": "nomic-embed-text-v2-moe",
      "dimensions": 768
    }
  }
}
```

### 3. Tracks & Flows (轨道与编排) ⭐
这是 MemoHub 最强大的部分。您可以定义一个 `op`（操作）在经过该轨道时，具体调用哪些原子工具。

```jsonc
"tracks": [
  {
    "id": "track-insight",
    "flows": {
      "ADD": [
        // 第一步：调用实体链接器提取关键词
        { "step": "extract", "tool": "builtin:entity-linker" },
        // 第二步：将原始内容存入 CAS
        { "step": "store", "tool": "builtin:cas" },
        // 第三步：生成向量并存入 Soul
        { "step": "index", "tool": "builtin:vector", "input": "$.nodes.extract.output" }
      ]
    }
  }
]
```

---

## 🚀 MVP 调优建议

1. **向量维度**: 确保 `dimensions` 与您的 Ollama 模型对齐（如 `nomic` 为 768）。
2. **影子同步**: 在 Web UI 修改此文件后，CLI 无需重启即可实时读取内存中的新 Flow。

---

**MemoHub 的灵活性源于将逻辑从代码抽离到配置。**
