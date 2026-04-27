## 1. Setup & Environment

- [x] 1.1 Clone LibreChat repository into a temporary directory
- [x] 1.2 Copy necessary client and api source code into `apps/web`
- [x] 1.3 Refactor `apps/web/package.json` to match MemoHub monorepo standards
- [x] 1.4 Setup MongoDB and Redis containers for local development persistence

## 2. Build Pipeline (Vite Convergence)

- [x] 2.1 Migrate LibreChat client build system from CRA/Webpack to Vite
- [x] 2.2 Configure Vite aliases to support shared MemoHub packages (@memohub/*)
- [x] 2.3 Verify `bun run build --filter @memohub/web` produces a valid bundle

## 3. Kernel Bridge & API Proxy

- [x] 3.1 Implement a Fastify/Node proxy in `apps/cli` to route LibreChat requests to `MemoryKernel`
- [x] 3.2 Add `/api/providers/config` endpoints to manage AI credentials via UI
- [x] 3.3 Ensure message streaming support (Server-Sent Events) between Kernel and UI
- [ ] 3.4 Implement Citation metadata extraction for conversational sources

## 4. Feature Porting (Orchestration Dashboard)

- [x] 4.1 Create a "MemoHub Settings" component within LibreChat UI
- [x] 4.2 Port ReactFlow "Flow Studio" as an integrated module in the dashboard
- [x] 4.3 Build the "Registry Matrix" UI for hot-reloading tracks and tools
- [x] 4.4 Implement MCP Skill governance panel (enable/disable tools)

## 5. Verification & Delivery

- [x] 5.1 Verify multi-provider switching in the new chat interface
- [x] 5.2 Validate real-time flow updates via the integrated Studio
- [x] 5.3 Perform a full system integration test: `bun cli ui` -> Chat with citations
- [ ] 5.4 Archive the old `apps/web` legacy components
