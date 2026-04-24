## 1. 基础基建：独立配置包与 XDG 引擎 (@memohub/config)

- [x] 1.1 创建 `packages/config` 目录及其 `package.json`
- [x] 1.2 定义基于 Zod 的完整 `memohub.json` Schema
- [x] 1.3 实现 JSONC 解析器，并支持配置版本化验证
- [x] 1.4 实现环境变量深度合并（Double Underscore 语法）
- [x] 1.5 编写跨平台 XDG 路径解析逻辑，并加入 Secret 脱敏脱壳处理

## 2. 抽象隔离：AI-Hub 与 Manifest-Based Tooling

- [x] 2.1 在 `packages/core` 或单独包中实现 `AIHub`，管理多 Providers 与 Agents
- [x] 2.2 定义 `IToolManifest` 契约接口和强类型 `inputSchema` / `outputSchema`
- [x] 2.3 重构现有的 CAS 和 Vector 存储逻辑，将其封装为符合契约的内置 Tools (`builtin:cas`, `builtin:vector`)
- [x] 2.4 提供 `ToolRegistry` 工具注册中心

## 3. 调度引擎重构：Flow Engine & Observation Kernel

- [x] 3.1 引入 `ObservationKernel`，实现 `TraceID` 生成、日志 NDJSON 写入与 `SafeRunner` 异常隔离
- [x] 3.2 重构 `MemoryKernel` 的执行流程，从硬编码类调用改为 `$.step.output` 上下文池变量映射（Flow Executor）
- [x] 3.3 根据配置文件中声明的 `tracks.flow` 数组编排步骤
- [x] 3.4 重写现有的 `track-insight` 和 `track-source` 为完全基于配置的流程调用

## 4. 适配层改造与 Web 预备 (app-cli-entry & UI-Readiness)

- [x] 4.1 清理 `apps/cli/src/index.ts` 中的冗余实例化逻辑，完全代理给 `@memohub/config`
- [x] 4.2 实现 `memohub config --init` 写入 JSONC 模板文件
- [x] 4.3 实现 `memohub config --check`，扫描配置完整性并打印 `Tool Manifests` 状态（供 Web UI 反射）
- [x] 4.4 提供旧版 `config.yaml` 与 LanceDB 数据的平滑升级脚本
- [x] 4.5 编写全链路功能回归测试，涵盖 Trace 生成验证和异常中断安全隔离
