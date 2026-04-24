# API 文档

MemoHub 提供了完整的 CLI API 和 TypeScript API。

## CLI API

### 全局命令

#### `mh --help`
显示帮助信息。

```bash
mh --help
mh -h
```

---

### 统计命令

#### `mh stats`
显示数据库统计信息。

```bash
mh stats
```

**输出示例**：
```
GBrain (通用知识):
  总记录数: 69
  数据库路径: ~/.memohub/track-insight.lancedb
  嵌入模型: nomic-embed-text-v2-moe
  向量维度: 768

ClawMem (代码记忆):
  总记录数: 833
  数据库路径: ~/.memohub/track-source.lancedb
  嵌入模型: nomic-embed-text-v2-moe
  向量维度: 768
```

---

### GBrain 命令

#### `mh add-knowledge`
添加知识到 GBrain。

```bash
mh add-knowledge <text> [options]
```

**参数**：
- `<text>`: 知识内容（必需）

**选项**：
- `-c, --category <category>`: 分类（默认：other）
- `-i, --importance <number>`: 重要性评分 0-1（默认：0.5）
- `-t, --tags <tags>`: 标签列表（逗号分隔）

**示例**：
```bash
mh add-knowledge "用户喜欢 TypeScript" \
  -c user \
  -i 0.9 \
  -t preference,typescript
```

#### `mh search-knowledge`
搜索知识。

```bash
mh search-knowledge <query> [options]
```

**参数**：
- `<query>`: 搜索查询（必需）

**选项**：
- `-l, --limit <number>`: 返回结果数量（默认：5）
- `-c, --category <category>`: 按分类过滤

**示例**：
```bash
mh search-knowledge "TypeScript" -l 3
mh search-knowledge "用户偏好" -c user -l 5
```

#### `mh delete-knowledge`
删除知识。

```bash
mh delete-knowledge <ids>
```

**参数**：
- `<ids>`: 知识 ID 列表（逗号分隔）

**示例**：
```bash
mh delete-knowledge track-insight-id1,track-insight-id2,track-insight-id3
```

---

### ClawMem 命令

#### `mh add-code`
添加代码到 ClawMem。

```bash
mh add-code <code> [options]
```

**参数**：
- `<code>`: 代码内容（必需）

**选项**：
- `-f, --file-path <path>`: 文件路径
- `-a, --ast-type <type>`: AST 类型
- `-s, --symbol-name <name>`: 符号名
- `-l, --language <language>`: 编程语言
- `-i, --importance <number>`: 重要性评分 0-1（默认：0.5）
- `-t, --tags <tags>`: 标签列表（逗号分隔）

**示例**：
```bash
mh add-code "interface User { name: string; }" \
  -f user.ts \
  -a interface \
  -s User \
  -l typescript \
  -i 0.8 \
  -t user,model
```

#### `mh search-code`
搜索代码。

```bash
mh search-code <query> [options]
```

**参数**：
- `<query>`: 搜索查询（必需）

**选项**：
- `-l, --limit <number>`: 返回结果数量（默认：5）
- `-a, --ast-type <type>`: 按 AST 类型过滤
- `-l, --language <language>`: 按语言过滤

**示例**：
```bash
mh search-code "interface User" -l 3
mh search-code "function search" -a function -l 5
```

---

### 配置命令

#### `mh config`
配置管理。

```bash
mh config [options]
```

**选项**：
- `--validate`: 验证配置
- `--show`: 显示配置

**示例**：
```bash
mh config --validate
mh config --show
```

---

## TypeScript API

### 安装

```bash
npm install memohub
```

### 导入

```typescript
import { GBrain, ClawMem, Embedder, ConfigManager } from 'memohub';
```

### 初始化

```typescript
import { GBrain, ClawMem, Embedder, ConfigManager } from 'memohub';

// 加载配置
const configManager = new ConfigManager();
const config = configManager.getConfig();

// 初始化嵌入器
const embedder = new Embedder(config.embedding);

// 初始化数据库
const track-insight = new GBrain(config.track-insight, embedder);
const track-source = new ClawMem(config.track-source, embedder);

// 初始化数据库
await track-insight.initialize();
await track-source.initialize();
```

### GBrain API

#### 添加知识

```typescript
interface GBrainRecord {
  id: string;
  text: string;
  category: string;
  tags: string[];
  importance: number;
  embedding: number[];
  createdAt: string;
}

const record: GBrainRecord = {
  id: 'unique-id',
  text: '用户喜欢 TypeScript',
  category: 'user',
  tags: ['preference', 'typescript'],
  importance: 0.9,
  embedding: [], // 自动生成
  createdAt: new Date().toISOString()
};

await track-insight.add(record);
```

#### 搜索知识

```typescript
interface SearchResult {
  record: GBrainRecord;
  similarity: number;
}

const results = await track-insight.search('TypeScript', 5);
console.log(results);
```

#### 获取统计信息

```typescript
const stats = await track-insight.getStats();
console.log(stats);
// { totalRecords: 69, dbPath: '...', ... }
```

#### 删除知识

```typescript
await track-insight.delete(['id1', 'id2']);
```

### ClawMem API

#### 添加代码

```typescript
interface ClawMemRecord {
  id: string;
  text: string;
  filePath: string;
  symbolName: string;
  astType: string;
  language: string;
  tags: string[];
  importance: number;
  embedding: number[];
  createdAt: string;
}

const record: ClawMemRecord = {
  id: 'unique-id',
  text: 'interface User { name: string; }',
  filePath: 'user.ts',
  symbolName: 'User',
  astType: 'interface',
  language: 'typescript',
  tags: ['user', 'model'],
  importance: 0.8,
  embedding: [], // 自动生成
  createdAt: new Date().toISOString()
};

await track-source.add(record);
```

#### 搜索代码

```typescript
const results = await track-source.search('interface User', 5);
console.log(results);
```

#### 获取统计信息

```typescript
const stats = await track-source.getStats();
console.log(stats);
```

### Embedder API

#### 生成嵌入向量

```typescript
const embedder = new Embedder(config.embedding);
const embedding = await embedder.embed('用户喜欢 TypeScript');
console.log(embedding);
// [0.123, 0.456, ...] (768 维向量)
```

#### 批量嵌入

```typescript
const texts = ['文本1', '文本2', '文本3'];
const embeddings = await embedder.embedBatch(texts);
console.log(embeddings);
```

### ConfigManager API

#### 加载配置

```typescript
const configManager = new ConfigManager();
const config = configManager.getConfig();
console.log(config);
```

#### 应用环境变量覆盖

```typescript
configManager.applyEnvOverrides();
const config = configManager.getConfig();
```

#### 验证配置

```typescript
const isValid = configManager.validate();
console.log(isValid); // true/false
```

---

## 错误处理

### 错误类型

```typescript
class MemoHubError extends Error {
  constructor(message: string, public code: string) {
    super(message);
  }
}

// 使用示例
try {
  await track-insight.add(record);
} catch (error) {
  if (error instanceof MemoHubError) {
    console.error(`错误代码: ${error.code}`);
    console.error(`错误消息: ${error.message}`);
  }
}
```

### 常见错误代码

| 错误代码 | 描述 |
|---------|------|
| `CONFIG_INVALID` | 配置无效 |
| `DB_NOT_INITIALIZED` | 数据库未初始化 |
| `EMBEDDING_FAILED` | 嵌入生成失败 |
| `RECORD_NOT_FOUND` | 记录未找到 |
| `DUPLICATE_RECORD` | 重复记录 |

---

## 示例代码

### 完整示例

```typescript
import { GBrain, ClawMem, Embedder, ConfigManager } from 'memohub';

async function main() {
  try {
    // 1. 加载配置
    const configManager = new ConfigManager();
    configManager.applyEnvOverrides();
    const config = configManager.getConfig();

    // 2. 初始化组件
    const embedder = new Embedder(config.embedding);
    const track-insight = new GBrain(config.track-insight, embedder);
    const track-source = new ClawMem(config.track-source, embedder);

    // 3. 初始化数据库
    await track-insight.initialize();
    await track-source.initialize();

    // 4. 添加知识
    await track-insight.add({
      id: `track-insight-${Date.now()}`,
      text: '用户喜欢 TypeScript',
      category: 'user',
      tags: ['preference', 'typescript'],
      importance: 0.9,
      embedding: [],
      createdAt: new Date().toISOString()
    });

    // 5. 搜索知识
    const results = await track-insight.search('TypeScript', 3);
    console.log('搜索结果:', results);

    // 6. 获取统计
    const stats = await track-insight.getStats();
    console.log('统计信息:', stats);

  } catch (error) {
    console.error('错误:', error);
  }
}

main();
```

---

需要更多帮助？查看 [快速开始](../guides/quickstart.md) 或 [常见问题](faq.md)。
