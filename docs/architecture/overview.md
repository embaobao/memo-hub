# MemoHub 架构概览

## 系统架构图
```mermaid
graph TD
    Client[CLI / MCP Client] -->|Instruction| Kernel[MemoryKernel]
    
    subgraph "核心层 (Core)"
        Kernel --> Router[MemoryRouter]
        Router -->|Dispatch| Kernel
    end
    
    subgraph "轨道层 (Tracks)"
        Kernel --> Insight[Insight Track]
        Kernel --> Source[Source Track]
        Kernel --> Stream[Stream Track]
        Kernel --> Wiki[Wiki Track]
    end
    
    subgraph "原子工具池 (Atomic Tools)"
        Insight --> Tools[Builtin Tools]
        Source --> Tools
        Stream --> Tools
        Wiki --> Tools
        Tools --> CAS[builtin:cas]
        Tools --> Embed[builtin:embedder]
        Tools --> Vector[builtin:vector]
        Tools --> Retriever[builtin:retriever]
    end
    
    subgraph "存储层 (Storage)"
        CAS --> Flesh[CAS Storage]
        Vector --> Soul[Vector Storage (LanceDB)]
    end
```

## 核心设计理念
1. **Text2Mem 协议**: 所有指令流转均遵循 12 原子操作协议 (MemoOp)。
2. **四轨道架构**:
   - `track-insight`: 存储 LLM 提纯后的事实与决策。
   - `track-source`: 源代码 AST 及符号索引。
   - `track-stream`: 会话原始记录流。
   - `track-wiki`: 权威真理库。
3. **原子工具模式**: 所有轨道不直接操作存储，统一通过 `builtin:tools` 执行（CAS, Embedder, Vector, Retriever 等）。
4. **自动路由**: 通过 `MemoryRouter` 根据配置规则或内容特征自动映射目标轨道。
