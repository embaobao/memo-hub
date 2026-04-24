# MemoHub v1 轨道架构说明

## 📋 当前轨道状态

### ✅ 已实现的轨道（2 个）
1. **track-insight** (知识轨道)
   - 功能：存储知识、事实、概念
   - 实现：InsightTrack
   - 状态：✅ 完整实现

2. **track-source** (代码轨道)
   - 功能：存储代码、AST、符号
   - 实现：SourceTrack
   - 状态：✅ 完整实现

### 🔧 治理轨道（1 个）
3. **track-librarian** (治理轨道)
   - 功能：去重、冲突检测、蒸馏
   - 实现：Librarian
   - 状态：✅ 完整实现
   - 注意：这是治理轨道，不是记忆轨道

### 🚧 预留轨道（1 个）
4. **track-stream** (会话轨道)
   - 功能：存储会话上下文
   - 状态：⚠️ 占位符，未实现
   - 计划：用于存储对话历史、会话状态

---

## 🎯 双轨 vs 多轨架构

### 当前实现：双轨 + 治理

```
MemoryKernel
├── track-insight    (知识轨道)
├── track-source     (代码轨道)
└── track-librarian  (治理轨道)
```

### 设计目标：多轨架构

MemoHub v1 设计为**可扩展的多轨架构**：

```
MemoryKernel
├── track-insight    (知识轨道) ✅
├── track-source     (代码轨道) ✅
├── track-stream     (会话轨道) 🚧
└── [future tracks]  (未来轨道)
```

---

## 🔌 轨道扩展指南

### 添加新轨道的步骤

1. **创建轨道包**
   ```bash
   mkdir -p tracks/track-xxx
   cd tracks/track-xxx
   ```

2. **实现轨道接口**
   ```typescript
   import { ITrackProvider } from '@memohub/protocol';
   
   export class XxxTrack implements ITrackProvider {
     id = 'track-xxx';
     name = 'XXX Track';
     
     async initialize(kernel: IKernel): Promise<void> {
       // 初始化逻辑
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

4. **添加 CLI 命令**
   ```typescript
   program
     .command('add-xxx <content>')
     .description('Add xxx entry')
     .action(async (content, opts) => {
       // 命令实现
     });
   ```

---

## 📊 轨道对比

| 轨道 | 类型 | 用途 | 状态 |
|------|------|------|------|
| track-insight | 记忆轨道 | 知识、事实、概念 | ✅ 完整 |
| track-source | 记忆轨道 | 代码、AST、符号 | ✅ 完整 |
| track-stream | 记忆轨道 | 会话上下文 | 🚧 占位符 |
| track-librarian | 治理轨道 | 去重、蒸馏、冲突检测 | ✅ 完整 |

---

## 🎨 多轨优势

### 当前双轨
- ✅ 知识与代码分离
- ✅ 语义搜索精准
- ✅ 结构化管理

### 多轨扩展后
- ✅ 会话历史追踪
- ✅ 多维度记忆
- ✅ 灵活扩展能力
- ✅ 按场景隔离

---

## 🔮 未来可能的轨道

根据需求，可以添加：

1. **track-conversation** - 对话历史轨道
2. **track-task** - 任务管理轨道
3. **track-media** - 媒体资源轨道
4. **track-location** - 位置信息轨道
5. **track-relation** - 关系网络轨道

---

## 📝 总结

**当前状态**：
- ✅ 双轨记忆架构正常运行
- ✅ 治理轨道功能完整
- 🚧 预留扩展接口

**设计理念**：
- 🎯 核心双轨：知识 + 代码
- 🔧 可扩展：支持添加更多轨道
- 📊 统一协议：Text2Mem 协议
- 🏗️ 清晰分层：MemoryKernel 总线

---

**架构版本**: 3.0.0  
**最后更新**: 2026-04-24
