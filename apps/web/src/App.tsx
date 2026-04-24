import React, { useState, useCallback, useMemo } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  Panel,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  NodeProps
} from 'reactflow';
import 'reactflow/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Activity, Database, Settings, 
  Search, Box, Plus, Zap, ChevronRight, 
  History, ShieldCheck, Cpu, Code
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Ether UI 定制节点
 */
const ToolNode = ({ data, selected }: NodeProps) => {
  const isBuiltin = data.tool?.startsWith('builtin:');
  return (
    <div className={cn(
      "px-4 py-3 rounded-2xl glass min-w-[180px] transition-all duration-500",
      selected ? "border-accent-insight shadow-lg shadow-accent-insight/20 scale-105" : "border-border",
      data.isRunning && "animate-pulse border-accent-source"
    )}>
      <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-border border-none" />
      <div className="flex items-center gap-3">
        <div className={cn(
          "p-2 rounded-lg",
          isBuiltin ? "bg-accent-insight/10 text-accent-insight" : "bg-accent-source/10 text-accent-source"
        )}>
          {isBuiltin ? <Cpu size={16} /> : <Zap size={16} />}
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{data.step}</span>
          <span className="text-xs font-bold truncate max-w-[120px]">{data.tool.replace('builtin:', '')}</span>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-border border-none" />
    </div>
  );
};

const nodeTypes = {
  tool: ToolNode,
};

/**
 * 资产预览卡片
 */
const AssetCard = ({ item }: { item: any }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="glass p-5 rounded-3xl group cursor-pointer hover:border-accent-insight/30 transition-colors"
  >
    <div className="flex justify-between items-start mb-3">
      <span className="px-2 py-1 rounded-md bg-foreground/5 text-[10px] font-mono text-zinc-400 uppercase tracking-tighter">
        {item.trackId || 'insight'}
      </span>
      <span className="text-[10px] text-zinc-500 font-mono italic">{new Date(item.timestamp).toLocaleDateString()}</span>
    </div>
    <p className="text-sm line-clamp-3 leading-relaxed mb-4 text-zinc-300">
      {item.text || item.content || 'No content preview available...'}
    </p>
    <div className="flex gap-2">
       {(item.entities || []).slice(0, 3).map((e: string) => (
         <span key={e} className="text-[9px] px-2 py-0.5 rounded-full bg-accent-insight/10 text-accent-insight border border-accent-insight/20">
           {e}
         </span>
       ))}
    </div>
  </motion.div>
);

const App = () => {
  const [activeTab, setActiveTab] = useState('flow');
  const [nodes, setNodes, onNodesChange] = useNodesState([
    { id: '1', type: 'tool', position: { x: 0, y: 0 }, data: { step: 'storage', tool: 'builtin:cas' } },
    { id: '2', type: 'tool', position: { x: 250, y: 100 }, data: { step: 'embedding', tool: 'builtin:embedder' } },
    { id: '3', type: 'tool', position: { x: 120, y: 250 }, data: { step: 'indexing', tool: 'builtin:vector', isRunning: true } },
  ]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([
    { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: 'rgba(255,255,255,0.1)' } },
    { id: 'e2-3', source: '2', target: '3', animated: true, style: { stroke: '#0070F3' } },
  ]);

  const onConnect = useCallback((params: any) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const navItems = [
    { id: 'flow', icon: <Box size={18} />, label: 'Studio' },
    { id: 'search', icon: <Search size={18} />, label: 'Omni' },
    { id: 'assets', icon: <Database size={18} />, label: 'Assets' },
    { id: 'trace', icon: <Activity size={18} />, label: 'Trace' },
    { id: 'settings', icon: <Settings size={18} />, label: 'Config' },
  ];

  const mockAssets = [
    { trackId: 'track-insight', timestamp: Date.now(), text: 'MemoHub v1 uses Flow orchestration engine.', entities: ['V1', 'FlowEngine'] },
    { trackId: 'track-source', timestamp: Date.now(), text: 'export function createKernel() { ... }', entities: ['MemoryKernel', 'TypeScript'] },
    { trackId: 'track-wiki', timestamp: Date.now(), text: 'Standard operating procedures for AI Agents.', entities: ['SOP', 'Agent'] },
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground selection:bg-accent-insight selection:text-white">
      <div className="noise-overlay" />
      
      {/* Sidebar */}
      <aside className="w-64 glass border-r flex flex-col z-50">
        <div className="p-8">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-gradient-to-tr from-accent-insight via-accent-insight to-accent-source shadow-2xl shadow-accent-insight/40 flex items-center justify-center">
               <Zap size={20} className="text-white fill-white" />
            </div>
            <span className="font-bold tracking-tight text-xl">MemoHub</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-500 group relative",
                activeTab === item.id 
                  ? 'bg-foreground/5 text-foreground' 
                  : 'text-zinc-500 hover:text-foreground'
              )}
            >
              <span className={cn("transition-transform duration-500", activeTab === item.id ? 'scale-110' : 'group-hover:scale-110')}>
                {item.icon}
              </span>
              <span className="font-semibold text-sm tracking-tight">{item.label}</span>
              {activeTab === item.id && (
                <motion.div 
                  layoutId="active-highlight"
                  className="absolute left-0 w-1 h-6 rounded-full bg-accent-insight" 
                />
              )}
            </button>
          ))}
        </nav>

        <div className="p-6 mt-auto">
          <div className="flex items-center gap-3 glass p-4 rounded-3xl border-accent-source/10">
            <div className="h-2 w-2 rounded-full bg-cyber-green bg-[#50E3C2] shadow-[0_0_10px_#50E3C2] animate-pulse" />
            <span className="text-[10px] font-mono font-bold text-zinc-400">DAEMON_ONLINE:3000</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-10 border-b border-border z-40 bg-background/50 backdrop-blur-md">
           <div className="flex items-center gap-3">
              <History size={16} className="text-zinc-500" />
              <div className="flex items-center text-xs font-mono">
                <span className="text-zinc-500">workspaces /</span>
                <span className="ml-1 text-foreground font-bold hover:underline cursor-pointer">main-brain</span>
              </div>
              <ChevronRight size={14} className="text-zinc-700" />
              <span className="text-[10px] bg-foreground/5 px-2 py-0.5 rounded-full font-bold">PRODUCTION</span>
           </div>
           
           <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-2 text-[10px] font-mono text-zinc-500 bg-border/20 px-3 py-1.5 rounded-xl border border-border">
                <ShieldCheck size={12} className="text-accent-source" />
                <span>Verified v1.0.0</span>
              </div>
              <button className="h-10 w-10 rounded-full glass border border-border flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-all">
                <Plus size={18} />
              </button>
           </div>
        </header>

        {/* Viewport */}
        <div className="flex-1 relative overflow-hidden bg-[radial-gradient(circle_at_center,_var(--border)_1px,_transparent_1px)] [background-size:24px_24px]">
           <AnimatePresence mode="wait">
             <motion.div
               key={activeTab}
               initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
               animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
               exit={{ opacity: 0, scale: 1.02, filter: 'blur(10px)' }}
               transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
               className="h-full w-full"
             >
                {activeTab === 'flow' && (
                  <div className="h-full w-full">
                    <ReactFlow
                      nodes={nodes}
                      edges={edges}
                      onNodesChange={onNodesChange}
                      onEdgesChange={onEdgesChange}
                      onConnect={onConnect}
                      nodeTypes={nodeTypes}
                      fitView
                      className="bg-transparent"
                    >
                      <Background color="var(--border)" gap={24} size={1} />
                      <Controls className="!bg-background !border-border !shadow-none glass" />
                      <Panel position="top-right" className="p-2">
                         <div className="flex gap-2">
                           <button className="glass px-4 py-2 rounded-2xl text-xs font-bold hover:bg-foreground/5 transition-colors border-border">Deploy Flow</button>
                           <button className="bg-accent-insight text-white px-4 py-2 rounded-2xl text-xs font-bold shadow-lg shadow-accent-insight/20">Commit Changes</button>
                         </div>
                      </Panel>
                    </ReactFlow>
                  </div>
                )}

                {activeTab === 'assets' && (
                   <div className="p-10 h-full overflow-auto">
                      <div className="max-w-6xl mx-auto">
                        <div className="flex items-end justify-between mb-10">
                          <div>
                            <h2 className="text-3xl font-bold tracking-tight mb-2">Memory Matrix</h2>
                            <p className="text-zinc-500 text-sm">Explore across all memory tracks and workspaces.</p>
                          </div>
                          <div className="flex gap-3">
                             <div className="glass px-4 py-2 rounded-2xl text-xs font-medium border-accent-insight/20 text-accent-insight bg-accent-insight/5">All Tracks</div>
                             <div className="glass px-4 py-2 rounded-2xl text-xs font-medium border-border hover:bg-foreground/5 cursor-pointer transition-colors">By Date</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                           {mockAssets.map((asset, i) => (
                             <AssetCard key={i} item={asset} />
                           ))}
                           <div className="border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center gap-3 h-[180px] text-zinc-500 hover:border-zinc-700 hover:text-zinc-300 transition-all cursor-pointer">
                              <Plus size={24} />
                              <span className="text-xs font-bold">Inject New Memory</span>
                           </div>
                        </div>
                      </div>
                   </div>
                )}

                {activeTab === 'search' && (
                  <div className="h-full flex items-center justify-center p-8">
                     <div className="w-full max-w-2xl">
                        <div className="glass p-6 rounded-[2.5rem] shadow-2xl flex items-center gap-5 border-border/50 relative overflow-hidden group">
                           <div className="absolute inset-0 bg-gradient-to-r from-accent-insight/5 to-accent-source/5 opacity-0 group-focus-within:opacity-100 transition-opacity" />
                           <Search className="text-zinc-500 group-focus-within:text-accent-insight transition-colors" size={24} />
                           <input 
                              autoFocus
                              placeholder="Search anything from your digital brain..." 
                              className="bg-transparent border-none outline-none text-xl w-full placeholder:text-zinc-700 font-medium"
                           />
                           <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-foreground/5 border border-border">
                              <span className="text-[10px] font-bold opacity-50">⌘</span>
                              <span className="text-[10px] font-bold opacity-50">K</span>
                           </div>
                        </div>
                        <div className="mt-6 flex flex-wrap gap-3 justify-center">
                           {['TypeScript', 'Flow Engine', 'API Docs', 'Workflows'].map(tag => (
                             <span key={tag} className="text-xs px-4 py-2 rounded-2xl glass border-border hover:bg-foreground/5 cursor-pointer transition-colors">
                               {tag}
                             </span>
                           ))}
                        </div>
                     </div>
                  </div>
                )}
             </motion.div>
           </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default App;
