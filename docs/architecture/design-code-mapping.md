# MemoHub v1 设计与代码映射关系

## 📐 整体设计映射

### 1. Monorepo 结构设计

```
memohub/                          # 项目根目录
├── apps/                         # 应用层实现
│   └── cli/                      # 📂 CLI + MCP Server
│       ├── src/                  #    └─ index.ts (命令定义、内核初始化)
│       ├── dist/                 #    └─ index.js (编译输出)
│       └── package.json          #    └─ bin: { "memohub": "dist/index.js" }
│
├── packages/                     # 核心层实现
│   ├── protocol/                 # 📂 协议定义
│   │   ├── src/                  #    ├─ types.ts (Text2Mem 协议类型)
│   │   │                        #    ├─ schema.ts (协议验证 schema)
│   │   │                        #    └─ constants.ts (MemoOp 枚举)
│   │   └── index.ts              #    └─ 导出所有协议接口
│   │
│   ├── core/                     # 📂 核心内核
│   │   ├── src/                  #    ├─ kernel.ts (MemoryKernel 实现)
│   │   │                        #    ├─ config.ts (配置管理)
│   │   │                        #    ├─ embedder.ts (嵌入抽象)
│   │   │                        #    └─ hydration.ts (水合机制)
│   │   └── index.ts              #    └─ 导出核心功能
│   │
│   ├── ai-provider/              # 📂 AI 适配层
│   │   ├── src/                  #    ├─ ollama.ts (Ollama 适配器)
│   │   │                        #    ├─ embedder.ts (嵌入接口)
│   │   │                        #    └─ registry.ts (Provider 注册)
│   │   └── index.ts              #    └─ 导出 AI 提供者
│   │
│   ├── storage-flesh/            # 📂 CAS 存储层
│   │   ├── src/                  #    └─ cas.ts (Content Addressable Storage)
│   │   └── index.ts
│   │
│   ├── storage-soul/             # 📂 向量存储层
│   │   ├── src/                  #    └─ vector.ts (LanceDB 向量存储)
│   │   └── index.ts
│   │
│   └── librarian/                # 📂 检索流水线
│       ├── src/                  #    └─ librarian.ts (治理轨道)
│       └── index.ts
│
├── tracks/                       # 轨道层实现
│   ├── track-insight/            # 📂 知识轨道
│   │   ├── src/                  #    └─ insight.ts (InsightTrack 实现)
│   │   └── index.ts
│   │
│   └── track-source/             # 📂 代码轨道
│       ├── src/                  #    └─ source.ts (SourceTrack 实现)
│       └── index.ts
│
└── docs/                         # 文档层
    ├── architecture/             #    └─ 架构文档
    ├── guides/                   #    └─ 用户指南
    ├── development/              #    └─ 开发文档
    └── integration/              #    └─ 集成文档
```

---

## 🎯 核心组件映射

### MemoryKernel (核心内核)

**设计目标**: 统一的记忆管理总线

**代码位置**: `packages/core/src/kernel.ts`

**核心功能**:
```typescript
export class MemoryKernel {
  // 轨道注册
  async registerTrack(track: ITrackProvider): Promise<void>

  // 指令执行
  async execute(inst: Text2MemInstruction): Promise<Text2MemResult>

  // 事件系统
  on(event: string, handler: Function): void
  emit(event: string, data: any): void
}
```

**数据流**:
```
Text2MemInstruction
  ↓
MemoryKernel.execute()
  ↓
路由到对应 Track
  ↓
Track.execute()
  ↓
返回 Text2MemResult
```

---

### Text2Mem 协议

**设计目标**: 统一的记忆操作接口

**代码位置**: `packages/protocol/src/types.ts`

**12 种原子操作**:
```typescript
export enum MemoOp {
  // 写入操作
  ADD = 'ADD',                    // 添加记忆
  UPDATE = 'UPDATE',              // 更新记忆
  DELETE = 'DELETE',              // 删除记忆
  BATCH_ADD = 'BATCH_ADD',        // 批量添加

  // 读取操作
  GET = 'GET',                    // 获取单个
  SEARCH = 'SEARCH',              // 语义搜索
  LIST = 'LIST',                  // 列表查询
  SEARCH_ALL = 'SEARCH_ALL',      // 统一检索

  // 元数据操作
  GET_METADATA = 'GET_METADATA',  // 获取元数据
  UPDATE_METADATA = 'UPDATE_METADATA', // 更新元数据

  // 治理操作
  DEDUP = 'DEDUP',                // 去重
  DISTILL = 'DISTILL',            // 蒸馏
  HYDRATE = 'HYDRATE'             // 水合
}
```

**指令结构**:
```typescript
export interface Text2MemInstruction {
  op: MemoOp;                      // 操作类型
  track: string;                   // 目标轨道
  data: Record<string, unknown>;   // 操作数据
  metadata?: Record<string, unknown>; // 元数据
}
```

**结果结构**:
```typescript
export interface Text2MemResult {
  success: boolean;                // 是否成功
  data?: unknown;                  // 返回数据
  error?: string;                  // 错误信息
  metadata?: Record<string, unknown>; // 元数据
}
```

---

### Track 接口

**设计目标**: 可扩展的记忆轨道

**代码位置**: `packages/protocol/src/types.ts`

**轨道接口**:
```typescript
export interface ITrackProvider {
  id: string;                      // 轨道 ID
  name: string;                    // 轨道名称

  // 初始化
  initialize(kernel: IKernel): Promise<void>;

  // 执行指令
  execute(inst: Text2MemInstruction): Promise<Text2MemResult>;

  // 健康检查
  health(): Promise<boolean>;
}
```

**已实现轨道**:

| 轨道 | 代码位置 | 职责 |
|------|---------|------|
| **InsightTrack** | `tracks/track-insight/src/insight.ts` | 知识、事实、概念存储 |
| **SourceTrack** | `tracks/track-source/src/source.ts` | 代码、AST、符号存储 |
| **Librarian** | `packages/librarian/src/librarian.ts` | 去重、蒸馏、检索流水线 |

---

## 🗄️ 存储层映射

### CAS (Content Addressable Storage)

**设计目标**: 内容寻址，自动去重

**代码位置**: `packages/storage-flesh/src/cas.ts`

**核心功能**:
```typescript
export class ContentAddressableStorage {
  // 写入内容，返回 hash
  async write(content: string): Promise<string>

  // 读取内容
  async read(hash: string): Promise<string | null>

  // 检查存在
  async exists(hash: string): Promise<boolean>

  // 删除内容
  async delete(hash: string): Promise<void>
}
```

**存储结构**:
```
~/.memohub/blobs/
├── aa/
│   └── aab3c4...  (hash 前 2 位作为目录)
├── bb/
│   └── bbd5e6...
└── ...
```

**特性**:
- ✅ SHA256 哈希
- ✅ 自动去重
- ✅ 增量存储
- ✅ 原子写入

---

### 向量存储 (Vector Storage)

**设计目标**: 语义检索

**代码位置**: `packages/storage-soul/src/vector.ts`

**核心功能**:
```typescript
export class VectorStorage {
  // 添加向量
  async add(table: string, items: VectorItem[]): Promise<void>

  // 搜索向量
  async search(table: string, vector: number[], limit: number): Promise<SearchResult[]>

  // 获取条目
  async get(table: string, ids: string[]): Promise<Record<string, any>>

  // 删除条目
  async delete(table: string, ids: string[]): Promise<void>
}
```

**存储结构**:
```typescript
interface VectorItem {
  id: string;                      // 唯一 ID
  vector: number[];                // 768 维向量
  metadata: Record<string, any>;   // 元数据
}
```

**LanceDB 表**:
- `insight` - 知识轨道向量
- `source` - 代码轨道向量

**特性**:
- ✅ 余弦相似度
- ✅ HNSW 索引
- ✅ 元数据过滤
- ✅ 批量操作

---

## 🤖 AI 层映射

### Ollama 适配器

**设计目标**: 本地嵌入模型

**代码位置**: `packages/ai-provider/src/ollama.ts`

**核心功能**:
```typescript
export class OllamaAdapter implements IEmbedder {
  // 生成嵌入
  async embed(text: string): Promise<number[]>

  // 批量嵌入
  async embedBatch(texts: string[]): Promise<number[][]>
}
```

**配置**:
```yaml
embedding:
  url: http://localhost:11434/v1
  model: nomic-embed-text-v2-moe
  dimensions: 768
  timeout: 30
```

**模型信息**:
- **模型**: nomic-embed-text-v2-moe
- **维度**: 768
- **服务**: Ollama 本地服务

---

### Provider 注册表

**设计目标**: 可插拔的 AI 提供者

**代码位置**: `packages/ai-provider/src/registry.ts`

**注册机制**:
```typescript
export class AIProviderRegistry {
  // 注册嵌入器
  registerEmbedder(name: string, factory: () => IEmbedder): void

  // 获取嵌入器
  getEmbedder(name: string): IEmbedder

  // 注册补全器
  registerCompleter(name: string, factory: () => ICompleter): void
}
```

---

## 🔌 CLI 层映射

### 命令定义

**代码位置**: `apps/cli/src/index.ts`

**命令映射**:

| CLI 命令 | MemoOp | 目标轨道 | 函数 |
|---------|--------|---------|------|
| `memohub add` | ADD | track-insight | `addKnowledge()` |
| `memohub search` | SEARCH | track-insight | `searchKnowledge()` |
| `memohub list` | LIST | track-insight | `listCategories()` |
| `memohub delete` | DELETE | track-insight | `deleteKnowledge()` |
| `memohub add-code` | ADD | track-source | `addCode()` |
| `memohub search-code` | SEARCH | track-source | `searchCode()` |
| `memohub search-all` | SEARCH_ALL | Librarian | `unifiedSearch()` |
| `memohub dedup` | DEDUP | Librarian | `runDedup()` |
| `memohub distill` | DISTILL | Librarian | `runDistill()` |

**示例实现**:
```typescript
program
  .command('add <text>')
  .description('Add knowledge entry')
  .option('-c, --category <category>', 'Category')
  .option('-t, --tags <tags>', 'Tags (comma separated)')
  .action(async (text, options) => {
    const kernel = await createKernel();

    const result = await kernel.execute({
      op: MemoOp.ADD,
      track: 'track-insight',
      data: {
        content: text,
        category: options.category,
        tags: options.tags?.split(',') || []
      }
    });

    if (result.success) {
      console.log('✅ Added:', result.data);
    } else {
      console.error('❌ Error:', result.error);
    }
  });
```

---

### MCP Server

**代码位置**: `apps/cli/src/index.ts` (serve 命令)

**工具映射**:

| MCP 工具 | MemoOp | 实现函数 |
|---------|--------|---------|
| `memohub_add_knowledge` | ADD | `handleAddKnowledge()` |
| `memohub_search_knowledge` | SEARCH | `handleSearchKnowledge()` |
| `memohub_add_code` | ADD | `handleAddCode()` |
| `memohub_search_code` | SEARCH | `handleSearchCode()` |
| `memohub_unified_search` | SEARCH_ALL | `handleUnifiedSearch()` |
| `memohub_list_categories` | LIST | `handleListCategories()` |
| `memohub_delete_knowledge` | DELETE | `handleDeleteKnowledge()` |

---

## 🔄 数据流映射

### 写入流程代码映射

```
1. 用户输入
   └─ apps/cli/src/index.ts: Commander.js 解析

2. 构建 Text2MemInstruction
   └─ apps/cli/src/index.ts: createInstruction()

3. MemoryKernel.execute()
   └─ packages/core/src/kernel.ts: execute()

4. 路由到 Track
   └─ packages/core/src/kernel.ts: getTrack()

5. Track.execute()
   └─ tracks/track-insight/src/insight.ts: execute()

6. CAS 存储内容
   └─ packages/storage-flesh/src/cas.ts: write()

7. AI 生成嵌入
   └─ packages/ai-provider/src/ollama.ts: embed()

8. 向量存储
   └─ packages/storage-soul/src/vector.ts: add()

9. 返回结果
   └─ packages/protocol/src/types.ts: Text2MemResult
```

---

### 检索流程代码映射

```
1. 用户查询
   └─ apps/cli/src/index.ts: Commander.js 解析

2. 构建 Text2MemInstruction
   └─ apps/cli/src/index.ts: createInstruction()

3. MemoryKernel.execute()
   └─ packages/core/src/kernel.ts: execute()

4. Track.execute()
   └─ tracks/track-insight/src/insight.ts: execute()

5. AI 嵌入查询
   └─ packages/ai-provider/src/ollama.ts: embed()

6. 向量检索
   └─ packages/storage-soul/src/vector.ts: search()

7. CAS 取回内容
   └─ packages/storage-flesh/src/cas.ts: read()

8. 返回结果
   └─ packages/protocol/src/types.ts: Text2MemResult
```

---

## 📊 配置映射

### 配置文件结构

**位置**: `config/config.jsonc`

```yaml
# AI 配置
embedding:
  url: http://localhost:11434/v1      # Ollama 地址
  model: nomic-embed-text-v2-moe     # 嵌入模型
  dimensions: 768                     # 向量维度
  timeout: 30                         # 超时时间

# 存储配置
storage:
  dbPath: ~/.memohub/data/memohub.lancedb  # LanceDB 路径
  casPath: ~/.memohub/blobs                  # CAS 路径
```

**代码加载**:
```typescript
// apps/cli/src/index.ts
function loadConfig(): Record<string, any> {
  const configPath = process.env.MEMOHUB_CONFIG
    ?? path.join(process.cwd(), 'config', 'config.jsonc');

  return yaml.parse(fs.readFileSync(configPath, 'utf-8'));
}
```

---

## 🧪 测试映射

### 测试文件结构

```
packages/core/
├── src/
│   ├── cas.test.ts          # CAS 测试
│   └── hydration.test.ts    # 水合测试

tracks/track-insight/
└── src/
    └── insight.test.ts      # InsightTrack 测试

apps/cli/
├── src/
│   ├── cli.e2e.test.ts      # CLI E2E 测试
│   └── memocontext.e2e.test.ts # MemoContext 测试
```

**测试覆盖**:
- ✅ CAS 读写
- ✅ 向量存储
- ✅ 轨道操作
- ✅ CLI 命令
- ✅ MCP 工具

---

## 🚀 扩展点映射

### 添加新轨道

1. **创建轨道包**
   ```bash
   mkdir -p tracks/track-xxx
   ```

2. **实现接口**
   ```typescript
   // tracks/track-xxx/src/xxx.ts
   export class XxxTrack implements ITrackProvider {
     id = 'track-xxx';
     name = 'XXX Track';

     async initialize(kernel: IKernel): Promise<void> {
       // 初始化
     }

     async execute(inst: Text2MemInstruction): Promise<Text2MemResult> {
       // 处理逻辑
     }
   }
   ```

3. **在 CLI 中注册**
   ```typescript
   // apps/cli/src/index.ts
   import { XxxTrack } from '@memohub/track-xxx';
   await kernel.registerTrack(new XxxTrack());
   ```

### 添加新 AI Provider

1. **实现接口**
   ```typescript
   // packages/ai-provider/src/custom.ts
   export class CustomAdapter implements IEmbedder {
     async embed(text: string): Promise<number[]> {
       // 自定义嵌入逻辑
     }
   }
   ```

2. **注册到 Registry**
   ```typescript
   registry.registerEmbedder('custom', () => new CustomAdapter());
   ```

---

**版本**: 3.0.0
**最后更新**: 2026-04-24
