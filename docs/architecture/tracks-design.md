# MemoHub v3 - 多轨道动态矩阵架构

## 🎯 核心理念

MemoHub v3 采用 **"多轨道动态矩阵"** 架构，旨在成为像真实"数字大脑"一样的记忆内核。

**核心设计原则**:
- ✅ **高内聚、低耦合、特定解析** - 每个轨道职责明确
- ✅ **灵肉分离** - CAS 物理存储 + 向量索引
- ✅ **模型解耦** - 通过 AI Provider 接口
- ✅ **动态演进** - 支持轨道的动态注册和扩展

---

## 📊 轨道分类

### 1. 核心轨道（已实现）

#### Track: Source（静态资产轨道）

**职责**: 处理源代码，利用 Tree-sitter 进行 AST 解析

**核心功能**:
- ✅ 代码文件解析和存储
- ✅ AST 语法树提取
- ✅ 符号（函数、类、变量）索引
- ✅ 调用链实体记录
- ✅ 工程级精准召回

**存储结构**:
```typescript
{
  id: "source-xxx",
  track_id: "track-source",
  code: "原始代码内容",
  language: "typescript",
  symbols: ["functionName", "className"],
  ast_type: "function|class|variable",
  file_path: "./src/utils.ts",
  metadata: {
    hash: "SHA256",
    timestamp: "ISO 8601"
  }
}
```

**使用场景**:
- 代码片段检索
- API 使用示例查找
- 架构设计模式参考
- 工具函数库管理

---

#### Track: Insight（逻辑沉淀轨道）

**职责**: 存储 LLM 提纯后的事实、决策定论和用户偏好

**核心功能**:
- ✅ 事实性知识存储
- ✅ 用户偏好记录
- ✅ 决策定论保存
- ✅ 系统价值观维护

**存储结构**:
```typescript
{
  id: "insight-xxx",
  track_id: "track-insight",
  text: "知识内容",
  category: "user|project|environment|other",
  importance: 0.8,  // 0-1
  tags: ["preference", "typescript"],
  entities: ["TypeScript", "用户"],
  metadata: {
    source: "cli|mcp|api",
    confidence: 0.9,
    timestamp: "ISO 8601"
  }
}
```

**使用场景**:
- 用户偏好记忆
- 项目信息管理
- 技术决策记录
- 系统配置保存

**权重**: ⭐⭐⭐⭐⭐ (高于 Stream 轨道)

---

#### Track: Stream（时序流轨道）

**职责**: 记录原始对话 Log

**核心功能**:
- ✅ 对话历史存储
- ✅ 时序数据记录
- ✅ TTL（生存时间）管理
- ✅ 自动蒸馏和清理

**存储结构**:
```typescript
{
  id: "stream-xxx",
  track_id: "track-stream",
  content: "对话内容",
  session_id: "session-uuid",
  timestamp: "ISO 8601",
  ttl: 2592000,  // 30天（秒）
  distilled: false,  // 是否已蒸馏
  metadata: {
    role: "user|assistant|system",
    tokens: 150,
    timestamp: "ISO 8601"
  }
}
```

**TTL 机制**:
- **默认 TTL**: 30 天
- **蒸馏后删除**: 由 Librarian 蒸馏到 Insight 轨后删除
- **保持轻量**: 避免系统臃肿

**使用场景**:
- 对话历史记录
- 上下文恢复
- 临时信息存储
- 调试和审计

---

#### Track: Wiki（真理库轨道）

**职责**: 存储经过 Librarian 整理且通过"澄清环节"确认的结构化知识

**核心功能**:
- ✅ 结构化知识存储
- ✅ 澄清环节确认
- ✅ 真理库维护
- ✅ 知识版本管理

**存储结构**:
```typescript
{
  id: "wiki-xxx",
  track_id: "track-wiki",
  title: "知识标题",
  content: "结构化内容",
  category: "技术|业务|流程",
  verified: true,  // 是否经过澄清环节
  version: "1.0.0",
  metadata: {
    author: "user|system",
    verified_at: "ISO 8601",
    confidence: 1.0,  // 最高置信度
    sources: ["insight-xxx", "stream-yyy"]
  }
}
```

**澄清环节**:
1. **知识提取**: 从 Stream/Insight 提取候选知识
2. **冲突检测**: 检测逻辑冲突
3. **人工确认**: 触发澄清环节，由用户确认
4. **版本发布**: 确认后发布到 Wiki 轨

**使用场景**:
- 技术文档管理
- 业务规则存储
- 流程规范维护
- 真理库查询

---

### 2. 扩展轨道（计划中）

#### Track: Dependency（依赖管理轨道）🚧

**职责**: 专门索引第三方库的 API 定义和文档

**核心功能**:
- ✅ 第三方库 API 索引
- ✅ 依赖版本管理
- ✅ API 使用示例
- ✅ 兼容性检查

**使用场景**:
- API 文档查询
- 依赖版本选择
- 兼容性问题排查
- 最佳实践参考

---

#### Track: Task（任务管理轨道）🚧

**职责**: 管理 Agent 的执行进度和待办状态

**核心功能**:
- ✅ 任务创建和分配
- ✅ 进度跟踪
- ✅ 状态管理
- ✅ 依赖关系

**使用场景**:
- 任务队列管理
- 进度跟踪
- 待办事项
- 依赖调度

---

## 🏗️ 架构设计原则

### 1. 灵肉分离与 CAS 去重

**原则**: 无论增加多少个轨道，底座永远是 `storage-flesh`

**优势**:
- ✅ **物理去重**: 同一段内容只存储一份
- ✅ **跨轨道共享**: Source 轨和 Wiki 轨可共享同一段代码
- ✅ **存储优化**: 节省磁盘空间
- ✅ **索引一致**: 通过 hash 关联，不会失效

**示例**:
```typescript
// Source 轨存储代码
const hash1 = await cas.write("export function hello() {}");

// Wiki 轨引用相同代码
const hash2 = await cas.write("export function hello() {}");

// 物理存储只占一份（hash1 === hash2）
```

---

### 2. 模型解耦（AI-Provider）

**原则**: 所有的轨道逻辑严禁直接调用 OpenAI 或 Ollama 的 SDK

**优势**:
- ✅ **厂商无关**: 随时更换 AI 模型
- ✅ **成本优化**: 动态选择最优模型
- ✅ **代码稳定**: 模型切换不影响轨道逻辑

**示例**:
```typescript
// ❌ 错误: 直接调用 Ollama
import Ollama from 'ollama';
const vector = await Ollama.embed(text);

// ✅ 正确: 通过 AI Provider 接口
const embedder = kernel.getEmbedder();
const vector = await embedder.embed(text);
```

---

### 3. Librarian 的权力边界

**原则**: Librarian 可以执行"合并"和"归档"，但遇到逻辑冲突必须触发"澄清环节"

**权力范围**:
- ✅ **合并（Merge）**: 合并重复或相似的知识
- ✅ **归档（Archive）**: 将过期数据归档
- ✅ **蒸馏（Distill）**: 从 Stream 提炼到 Insight
- ❌ **自行裁决**: 遇到业务逻辑冲突必须暂停

**澄清环节**:
```
1. 检测冲突
   ↓
2. 暂停操作
   ↓
3. 触发澄清环节
   ↓
4. 用户确认
   ↓
5. 继续操作
```

---

## 🎯 多轨道动态矩阵

### 轨道注册机制

```typescript
// 动态注册轨道
await kernel.registerTrack(new SourceTrack());
await kernel.registerTrack(new InsightTrack());
await kernel.registerTrack(new StreamTrack());
await kernel.registerTrack(new WikiTrack());
await kernel.registerTrack(new DependencyTrack());  // 扩展
await kernel.registerTrack(new TaskTrack());         // 扩展
```

### 轨道路由机制

```typescript
// 指令路由到对应轨道
const result = await kernel.dispatch({
  op: MemoOp.ADD,
  trackId: 'track-source',  // 路由到 Source 轨
  payload: { code: "..." }
});
```

### 轨道间协作

```
Stream 轨（原始对话）
  ↓ 蒸馏
Insight 轨（逻辑沉淀）
  ↓ 澄清
Wiki 轨（真理库）

Source 轨（代码）
  ↓ 引用
Wiki 轨（文档）
```

---

## 📊 核心设计总结

| 核心组件 | 战略定位 | 解决的痛点 |
|---------|---------|-----------|
| **Text2Mem 契约** | **ISA (指令集标准)** | 解决了记忆操作的非标性，确保架构十年内无需重构 |
| **动态轨道注册制** | **插件化网格** | 解决了单一轨道臃肿问题，支持按需扩展解析能力 |
| **CAS 寻址 (Flesh)** | **物理底座** | 解决了数据冗余和索引链接失效问题，实现物理级去重 |
| **AI Provider 驱动** | **模型代理** | 解决了对特定 LLM 厂商的依赖，实现成本与性能的动态平衡 |
| **CLI / MCP 统一入口** | **交互枢纽** | 解决了工具链分散问题，本地工具与 Agent 后端共用一套内核 |

---

## 🚀 最终愿景：从"存储器"到"认知操作系统"

通过这套全平层 Monorepo 架构，**MemoHub** 已经不仅仅是一个 RAG 系统，它实际上是一个 **Agent 记忆内核**：

- ✅ **它是确定的**: CAS 保证了物理真实
- ✅ **它是可插拔的**: 模型和轨道皆为插件
- ✅ **它是进化的**: Librarian 异步治理确保知识不断提纯

---

## 📋 当前实现状态

### 已实现轨道 ✅

- ✅ **track-source**: 静态资产轨道（代码）
- ✅ **track-insight**: 逻辑沉淀轨道（知识）
- ✅ **track-librarian**: 治理轨道（去重、蒸馏）

### 计划实现轨道 🚧

- 🚧 **track-stream**: 时序流轨道（对话历史）
- 🚧 **track-wiki**: 真理库轨道（结构化知识）
- 🚧 **track-dependency**: 依赖管理轨道（第三方库）
- 🚧 **track-task**: 任务管理轨道（待办状态）

---

## 🔧 开发规范

### 代码注释规范

**要求**: 所有代码必须添加汉语注释

**TypeScript 示例**:
```typescript
/**
 * 知识轨道实现
 * 职责: 存储 LLM 提纯后的事实、决策定论和用户偏好
 * 优先级: 高于 Stream 轨道
 */
export class InsightTrack implements ITrackProvider {
  id = 'track-insight';
  name = '逻辑沉淀轨道';

  /**
   * 添加知识到轨道
   * @param instruction - Text2Mem 指令
   * @returns 添加结果
   */
  async execute(instruction: Text2MemInstruction): Promise<Text2MemResult> {
    // 实现逻辑...
  }
}
```

### 遵守 Airbnb JavaScript 规范

**核心规范**:
- ✅ 使用 2 空格缩进
- ✅ 使用单引号
- ✅ 使用分号
- ✅ 使用 const/let，不使用 var
- ✅ 函数命名使用 camelCase
- ✅ 类命名使用 PascalCase
- ✅ 常量使用 UPPER_SNAKE_CASE

**详细规范**: https://github.com/airbnb/javascript

### 输出规范

- ✅ **0.1** 所有输出必须使用中文
- ✅ **0.2** 专有名词允许保留原文（如 API, MCP, AST）
- ✅ **0.3** 禁止输出其他语言说明

---

**版本**: 3.0.0
**最后更新**: 2026-04-24
**架构类型**: 多轨道动态矩阵
