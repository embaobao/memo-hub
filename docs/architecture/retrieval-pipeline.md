# MemoHub 检索流水线 (Retrieval Pipeline)

## 🎯 核心理念

MemoHub 采用类似 LightRAG 的“三段式”检索流水线，旨在解决向量检索“只见树木不见森林”的问题。通过跨轨实体关联和加权召回，提供具备宏观视野和高可解释性的引用结果。

---

## 🏗️ 三段式流程

### 1. Pre-processing (预处理)
- **意图识别**: 分析用户 Query，识别是对代码 (`source`)、知识 (`insight`) 还是混合场景的检索。
- **实体抽取**: 从 Query 中提取核心实体（如类名、函数名、业务名词）。
- **Query 改写**: 为向量检索生成优化后的检索词。

### 2. Execution (执行)
- **多路召回 (Parallel Search)**:
  - **Vector**: 传统的向量相似度搜索（各轨道独立执行）。
  - **Lexical**: 基于关键字命中的词法检索，用于弥补向量检索在特定词汇上的不足。
  - **Entity Expansion (High-level)**: 从初步命中的结果中提取高频实体，反向跨轨拉取相关记录，形成宏观上下文。
- **降级策略**: 当向量存储繁忙或实体索引不可用时，自动切换至轻量级词法兜底。

### 3. Post-processing (后处理)
- **融合去重**: 基于内容哈希 (`hash`) 和唯一 ID 进行物理级去重。
- **智能重排 (Reranking)**: 综合考虑向量分、实体覆盖率、轨道权重及时间戳。
- **引用格式化**: 强制输出包含 `trackId`, `id`, `text`, `timestamp`, `filePath` 等字段的 `citation-ready` 结构。

---

## 📊 实体扩展召回 (Pseudo-Graph)

MemoHub 不依赖重型图数据库，而是通过各轨道的 `entities` 字段构建“逻辑图谱”：

1. **种子命中**: 向量检索命中记录 A。
2. **实体提取**: 从 A 中获取实体 `["MemoryKernel", "TypeScript"]`。
3. **关联扩展**: 在所有轨道中查找包含上述实体的其他记录（如相关的文档或调用代码）。
4. **上下文补全**: 将关联记录并入结果池。

---

## 🔧 配置与调参

在 `config.yaml` 中可以通过以下参数调整流水线行为：

```yaml
search:
  # 实体扩展硬上限
  max_expansion_entities: 5
  # 跨轨召回权重分配
  track_weights:
    track-insight: 1.2
    track-source: 1.0
  # 启用词法通道
  enable_lexical: true
```
