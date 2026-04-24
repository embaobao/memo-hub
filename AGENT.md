# AGENT.md - MemoHub v3 开发规范

本文档定义 MemoHub v3 项目的开发规范和规则，所有开发者（包括 AI Agent）必须遵守。

---

## 🎯 开发原则

### 1. Monorepo 架构优先
- ✅ 代码放在正确的位置：apps/、packages/、tracks/
- ✅ 遵循依赖方向：apps → tracks → packages
- ❌ 禁止循环依赖
- ❌ 禁止跨层依赖（如 packages → apps）

### 2. Text2Mem 协议统一
- ✅ 所有轨道操作通过 `kernel.dispatch()` 执行
- ✅ 使用统一的 `Text2MemResult` 返回格式
- ✅ 遵循 12 个原子操作指令
- ❌ 禁止绕过 Kernel 直接操作存储

### 3. 类型安全第一
- ✅ 使用 TypeScript 严格模式
- ✅ 导出类型定义
- ✅ 运行时验证（Zod）
- ❌ 禁止 `any` 类型（除非有充分理由）

### 4. 测试覆盖完整
- ✅ 新功能必须有测试
- ✅ 测试失败不合并
- ✅ 集成测试覆盖核心流程
- ❌ 禁止提交没有测试的代码

### 5. 文档同步更新
- ✅ 修改功能时更新相关文档
- ✅ API 变更更新 API 文档
- ✅ 架构变更更新架构文档
- ❌ 禁止文档与代码不一致

---

## 📝 代码注释规范

### 核心原则

**所有代码必须添加汉语注释，详细解释每个功能和文件的作用。**

### 1. 文件头注释

**要求**: 每个文件必须包含文件头注释

**模板**:
```typescript
/**
 * 文件名: insight.ts
 * 职责: 知识轨道实现
 * 描述: 存储 LLM 提纯后的事实、决策定论和用户偏好
 * 
 * @author 开发团队
 * @since 2026-04-24
 * @version 3.0.0
 */
```

### 2. 类注释

**要求**: 每个类必须包含 JSDoc 注释

**模板**:
```typescript
/**
 * 知识轨道实现
 * 职责: 存储 LLM 提炼后的事实、决策定论和用户偏好
 * 优先级: 高于 Stream 轨道
 * 
 * @example
 * ```typescript
 * const track = new InsightTrack();
 * await kernel.registerTrack(track);
 * ```
 */
export class InsightTrack implements ITrackProvider {
  // 实现...
}
```

### 3. 函数注释

**要求**: 每个函数必须包含 JSDoc 注释

**模板**:
```typescript
/**
 * 添加知识到轨道
 * 
 * @param instruction - Text2Mem 指令，包含操作类型和数据
 * @returns 返回操作结果，包含成功状态、数据和错误信息
 * 
 * @example
 * ```typescript
 * const result = await track.execute({
 *   op: MemoOp.ADD,
 *   trackId: 'track-insight',
 *   payload: { text: "知识内容" }
 * });
 * ```
 */
async execute(instruction: Text2MemInstruction): Promise<Text2MemResult> {
  // 实现逻辑...
}
```

### 4. 行内注释

**要求**: 复杂逻辑必须添加行内注释

**示例**:
```typescript
// 生成 SHA256 哈希，用于 CAS 存储
const hash = await cas.write(content);

// 生成 768 维向量，用于语义检索
const vector = await embedder.embed(content);

// 计算相似度阈值，用于去重判断
const similarity = cosineDistance(vec1, vec2);
if (similarity > 0.95) {
  // 相似度超过阈值，标记为重复
  duplicates.push({ id1, id2, similarity });
}
```

### 5. 块注释

**要求**: 复杂逻辑块必须添加块注释

**示例**:
```typescript
/**
 * 知识蒸馏流程
 * 
 * 1. 从 Stream 轨读取原始对话
 * 2. 使用 LLM 提炼关键信息
 * 3. 存储到 Insight 轨
 * 4. 删除 Stream 轨中的原始数据
 * 
 * 注意: 必须等待 LLM 提炼完成后才能删除原始数据
 */
async distillStreamToInsight(streamIds: string[]): Promise<void> {
  // 实现逻辑...
}
```

---

## 🔧 TypeScript/JavaScript 规范

### 遵守 Airbnb JavaScript 规范

**官方规范**: https://github.com/airbnb/javascript

### 核心规范

#### 1. 缩进和空格

```typescript
// ✅ 正确: 使用 2 空格缩进
function hello() {
  const name = 'world';
  console.log(name);
}

// ❌ 错误: 使用 4 空格或 Tab
function hello() {
    const name = 'world';  // 4 空格
    console.log(name);
}
```

#### 2. 引号

```typescript
// ✅ 正确: 使用单引号
const message = 'Hello World';

// ❌ 错误: 使用双引号（除非字符串中包含单引号）
const message = "Hello World";

// ✅ 例外: 字符串中包含单引号时使用双引号
const message = "It's a beautiful day";
```

#### 3. 分号

```typescript
// ✅ 正确: 使用分号
const name = 'world';
console.log(name);

// ❌ 错误: 不使用分号
const name = 'world'
console.log(name)
```

#### 4. 变量声明

```typescript
// ✅ 正确: 使用 const/let
const MAX_COUNT = 100;
let currentCount = 0;

// ❌ 错误: 使用 var
var maxCount = 100;
var currentCount = 0;
```

#### 5. 命名规范

```typescript
// ✅ 正确: 函数使用 camelCase
function getUserInfo() {}
const calculateTotal = () => {};

// ✅ 正确: 类使用 PascalCase
class UserManager {}
class HttpClient {}

// ✅ 正确: 常量使用 UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3;
const DEFAULT_TIMEOUT = 5000;

// ❌ 错误: 混用命名规范
function GetUserInfo() {}  // 应该是 camelCase
class userManager {}      // 应该是 PascalCase
const max_retry_count = 3 // 应该是 UPPER_SNAKE_CASE
```

#### 6. 比较操作

```typescript
// ✅ 正确: 使用 === 和 !==
if (name === 'world') {}
if (count !== 0) {}

// ❌ 错误: 使用 == 和 !=
if (name == 'world') {}  // 可能触发类型转换
if (count != 0) {}
```

---

## 🌐 输出规范

### 原则

**所有输出必须使用中文，专有名词允许保留原文。**

### 规则

- **0.1** 所有输出必须使用中文
- **0.2** 专有名词允许保留原文（如 API, MCP, AST, JSON, YAML）
- **0.3** 禁止输出其他语言说明

### 示例

```typescript
// ✅ 正确: 中文输出，专有名词保留原文
console.log('正在连接到 MCP 服务器...');
console.log(`API 调用失败: ${error.message}`);
console.log('AST 解析完成，共提取 5 个函数');

// ❌ 错误: 混用中英文
console.log('正在连接到 MCP Server...');  // "Server" 应该翻译
console.log('API call failed');            // 完全英文，不符合规范
```

### 错误信息

```typescript
// ✅ 正确: 中文错误信息
throw new Error('无法连接到 Ollama 服务器');
throw new Error('文件不存在: /path/to/file');
throw new Error('参数类型错误: 期望 string，实际 number');

// ❌ 错误: 英文错误信息
throw new Error('Failed to connect to Ollama server');
throw new Error('File not found: /path/to/file');
```

---

## 📁 目录结构规范

### apps/ - 应用层
```
apps/cli/
├── src/              # 源代码
│   ├── index.ts      # 主入口
│   └── mcp.ts        # MCP 服务器
├── dist/             # 编译产物（自动生成）
└── package.json      # 包配置
```

### packages/ - 核心层
```
packages/protocol/
├── src/              # 源代码
│   ├── types.ts      # 类型定义
│   └── schema.ts     # Zod 验证
├── dist/             # 编译产物（自动生成）
└── package.json      # 包配置
```

### tracks/ - 轨道层
```
tracks/track-insight/
├── src/              # 源代码
│   └── index.ts      # 主入口
├── dist/             # 编译产物（自动生成）
└── package.json      # 包配置
```

---

## 🏷️ 命名规范

### 文件命名

```typescript
// ✅ 正确: 使用 kebab-case
import { utils } from './file-utils';
import { api } from './api-client';

// ❌ 错误: 使用 camelCase 或 PascalCase
import { utils } from './fileUtils';
import { api } from './ApiClient';
```

### 导入顺序

```typescript
// 1. Node.js 内置模块
import * as fs from 'node:fs';
import * as path from 'node:path';

// 2. 第三方库
import { Command } from 'commander';
import chalk from 'chalk';

// 3. 内部模块
import { MemoryKernel } from '@memohub/core';
import { InsightTrack } from '@memohub/track-insight';

// 4. 相对路径导入
import { utils } from './utils';
import { constants } from './constants';
```

---

## 📋 代码审查清单

### 提交代码前检查

- [ ] 所有文件都有文件头注释
- [ ] 所有类都有 JSDoc 注释
- [ ] 所有函数都有 JSDoc 注释
- [ ] 复杂逻辑都有行内注释
- [ ] 遵守 Airbnb JavaScript 规范
- [ ] 使用 2 空格缩进
- [ ] 使用单引号
- [ ] 使用分号
- [ ] 使用 const/let，不使用 var
- [ ] 使用 === 和 !==
- [ ] 所有输出都是中文
- [ ] 专有名词保留原文
- [ ] 类型注解完整
- [ ] 异步使用 async/await
- [ ] 错误处理完善

---

## 🚀 多轨道动态矩阵架构

### 轨道设计原则

**高内聚、低耦合、特定解析**

### 已实现轨道 ✅

- ✅ **track-source**: 静态资产轨道（代码）
- ✅ **track-insight**: 逻辑沉淀轨道（知识）
- ✅ **track-librarian**: 治理轨道（去重、蒸馏）

### 计划实现轨道 🚧

- 🚧 **track-stream**: 时序流轨道（对话历史）
- 🚧 **track-wiki**: 真理库轨道（结构化知识）
- 🚧 **track-dependency**: 依赖管理轨道（第三方库）
- 🚧 **track-task**: 任务管理轨道（待办状态）

### 轨道注册示例

```typescript
// 动态注册轨道
await kernel.registerTrack(new SourceTrack());
await kernel.registerTrack(new InsightTrack());
await kernel.registerTrack(new StreamTrack());    // 扩展
await kernel.registerTrack(new WikiTrack());      // 扩展
```

---

## 📚 参考资源

- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- [TypeScript 官方文档](https://www.typescriptlang.org/docs/)
- [JSDoc 官方文档](https://jsdoc.app/)
- [轨道设计文档](docs/architecture/tracks-design.md)

---

**版本**: 3.0.0
**最后更新**: 2026-04-24
**架构类型**: 多轨道动态矩阵
**维护者**: 开发团队
