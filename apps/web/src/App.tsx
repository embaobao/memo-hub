import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  Panel,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  NodeProps,
  Handle,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Box, Search, Database, Activity, Settings, 
  Cpu, Zap, ChevronRight, History, ShieldCheck, 
  Plus, Terminal, Globe, Send, Layers
} from 'lucide-react';
import { TracePanel, AgentSandbox } from './components/Sandbox';

// --- Ether UI 节点定制 ---
const ToolNode = ({ data, selected }: NodeProps) => {
  const isBuiltin = data.tool?.startsWith('builtin:');
  const isTrack = data.tool?.includes(':') && !isBuiltin;

  return (
    <div className={`px-4 py-3 rounded-2xl glass min-w-[200px] transition-all duration-500 border ${
      selected ? "border-blue-500 shadow-2xl shadow-blue-500/20 scale-105" : "border-white/10"
    }`}>
      <Handle type="target" position={Position.Top} className="!bg-zinc-700 border-none" />
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl ${
          isBuiltin ? "bg-blue-500/10 text-blue-400" : isTrack ? "bg-purple-500/10 text-purple-400" : "bg-emerald-500/10 text-emerald-400"
        }`}>
          {isBuiltin ? <Cpu size={16} /> : isTrack ? <Layers size={16} /> : <Zap size={16} />}
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest truncate">{data.step}</span>
          <span className="text-xs font-bold truncate">{data.tool}</span>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-zinc-700 border-none" />
    </div>
  );
};

const nodeTypes = {
  tool: ToolNode,
};

// --- 属性面板组件 ---
const PropertyPanel = ({ node, tools, onSave }: { node: any, tools: any[], onSave: (id: string, data: any) => void }) => {
  const toolManifest = tools.find(t => t.id === node.data.tool);
  const [formData, setFormData] = useState(node.data.input || {});

  useEffect(() => {
    setFormData(node.data.input || {});
  }, [node.id]);

  return (
    <motion.div 
      initial={{ x: 300 }} animate={{ x: 0 }} exit={{ x: 300 }}
      className="w-80 glass border-l border-white/5 p-6 h-full flex flex-col z-50 bg-black/40 backdrop-blur-2xl"
    >
      <div className="flex items-center gap-2 mb-6">
        <Settings size={16} className="text-blue-400" />
        <h3 className="font-bold text-sm uppercase tracking-widest">Node Properties</h3>
      </div>

      <div className="flex-1 space-y-6 overflow-auto">
        <div>
          <label className="text-[10px] text-zinc-500 uppercase font-bold mb-2 block">Step ID</label>
          <input readOnly value={node.data.step} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-zinc-400 outline-none" />
        </div>

        <div>
          <label className="text-[10px] text-zinc-500 uppercase font-bold mb-2 block">Atomic Tool</label>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs">
            <Cpu size={12} className="text-blue-400" />
            <span className="font-mono">{node.data.tool}</span>
          </div>
        </div>

        <div className="pt-4 border-t border-white/5">
           <label className="text-[10px] text-zinc-500 uppercase font-bold mb-3 block">Input Mapping (JSONPath)</label>
           {Object.keys(formData).map(key => (
             <div key={key} className="mb-4">
               <span className="text-[11px] text-zinc-300 font-mono mb-1 block">{key}</span>
               <input 
                 value={formData[key]} 
                 onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                 className="w-full bg-black/40 border border-white/10 focus:border-blue-500/50 rounded-xl px-4 py-2.5 text-xs outline-none transition-all"
               />
             </div>
           ))}
        </div>
      </div>

      <button 
        onClick={() => onSave(node.id, formData)}
        className="mt-6 w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-xs shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
      >
        Update Shadow Config
      </button>
    </motion.div>
  );
};

// --- 主应用 ---
const App = () => {
  const [activeTab, setActiveTab] = useState('flow');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [sysInfo, setSysInfo] = useState({ tracks: [], tools: [], config: {} });
  const [isLoaded, setIsLoaded] = useState(false);

  const onNodeClick = useCallback((_: any, node: any) => setSelectedNodeId(node.id), []);
  const onPaneClick = useCallback(() => setSelectedNodeId(null), []);

  const updateNodeInput = (nodeId: string, inputData: any) => {
    setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, input: inputData } } : n));
    // 发送影子更新到后端
    console.log('Syncing shadow config for node:', nodeId, inputData);
  };

  const [logs, setLogs] = useState<any[]>([]);
  const [activeTraceNode, setActiveTraceNode] = useState<string | null>(null);

  // 3. WebSocket 实时监听
  useEffect(() => {
    const ws = new WebSocket(`ws://${window.location.host}/ws/trace`);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'KERNEL_EVENT') {
        setLogs(prev => [{ ...data.payload, time: new Date(data.timestamp).toLocaleTimeString() }, ...prev].slice(0, 100));
        
        // 驱动画布脉冲: 简单匹配 trackId
        if (data.payload.stage === 'start') {
          setActiveTraceNode(data.payload.trackId);
          setTimeout(() => setActiveTraceNode(null), 2000);
        }
      }
    };
    return () => ws.close();
  }, []);

  // 修改 nodeTypes 数据流转，支持脉冲
  const processedNodes = useMemo(() => nodes.map(n => ({
    ...n,
    data: { ...n.data, isRunning: activeTraceNode === n.data.trackId || n.id === activeTraceNode }
  })), [nodes, activeTraceNode]);

  // 2. 将 JSONC Flow 转换为图形
  const mapFlowToGraph = (track: any, op: string) => {
    const flow = track.flows?.[op] || [];
    const newNodes = flow.map((step: any, index: number) => ({
      id: `${track.id}-${op}-${index}`,
      type: 'tool',
      position: { x: 250, y: index * 120 },
      data: { step: step.step, tool: step.tool }
    }));

    const newEdges = newNodes.slice(0, -1).map((node: any, index: number) => ({
      id: `e-${index}`,
      source: node.id,
      target: newNodes[index + 1].id,
      animated: true,
      style: { stroke: '#3b82f6', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' }
    }));

    setNodes(newNodes);
    setEdges(newEdges);
  };

  const navItems = [
    { id: 'flow', icon: <Box size={18} />, label: 'Studio' },
    { id: 'search', icon: <Globe size={18} />, label: 'Sandbox' },
    { id: 'assets', icon: <Database size={18} />, label: 'Matrix' },
    { id: 'trace', icon: <Activity size={18} />, label: 'Trace' },
    { id: 'settings', icon: <Settings size={18} />, label: 'Config' },
  ];

  if (!isLoaded) return <div className="h-screen w-screen bg-black flex items-center justify-center font-mono text-zinc-500">Loading Ether System...</div>;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#000] text-zinc-100 selection:bg-blue-500/30">
      <div className="noise-overlay" />
      
      {/* Sidebar - iOS Glassmorphism */}
      <aside className="w-64 glass border-r border-white/5 flex flex-col z-50">
        <div className="p-8">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-400 shadow-2xl shadow-blue-500/40 flex items-center justify-center">
               <Zap size={20} className="text-white fill-white" />
            </div>
            <span className="font-bold tracking-tighter text-xl">MemoHub</span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-500 group relative ${
                activeTab === item.id ? 'bg-white/5 text-white' : 'text-zinc-500 hover:text-zinc-200'
              }`}
            >
              <span className={activeTab === item.id ? 'scale-110 text-blue-400' : 'group-hover:scale-110'}>
                {item.icon}
              </span>
              <span className="font-semibold text-sm tracking-tight">{item.label}</span>
              {activeTab === item.id && (
                <motion.div layoutId="active-nav" className="absolute left-0 w-1 h-6 rounded-full bg-blue-500" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-6 mt-auto">
          <div className="glass p-4 rounded-3xl border-emerald-500/20 bg-emerald-500/5">
             <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">System Online</span>
             </div>
             <p className="text-[10px] text-zinc-500 font-mono">Kernel v1.0.0-stable</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative flex flex-col overflow-hidden">
        <header className="h-20 flex items-center justify-between px-10 border-b border-white/5 z-40 bg-black/20 backdrop-blur-xl">
           <div className="flex items-center gap-3">
              <History size={16} className="text-zinc-600" />
              <div className="text-xs font-mono">
                <span className="text-zinc-500">workspaces /</span>
                <select 
                  value={activeWorkspace}
                  onChange={(e) => setActiveWorkspace(e.target.value)}
                  className="bg-transparent border-none outline-none text-white font-bold ml-1 cursor-pointer hover:underline"
                >
                  {workspaces.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
              <ChevronRight size={14} className="text-zinc-700" />
              <div className="text-xs font-mono">
                <span className="text-zinc-500">tracks /</span>
                <select 
                  className="bg-transparent border-none outline-none text-white font-bold ml-1 cursor-pointer hover:underline"
                  onChange={(e) => {
                    const track = sysInfo.tracks.find((t: any) => t.id === e.target.value);
                    if (track) mapFlowToGraph(track, 'ADD');
                  }}
                >
                  {sysInfo.tracks.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
           </div>
           
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                <ShieldCheck size={12} className="text-emerald-500" />
                <span>Verified TraceID: {Math.random().toString(36).slice(2, 10)}</span>
              </div>
              <button className="h-10 w-10 rounded-full glass border border-white/10 flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
                <Plus size={18} />
              </button>
           </div>
        </header>

        <div className="flex-1 relative flex">
           <AnimatePresence mode="wait">
             <motion.div
               key={activeTab}
               initial={{ opacity: 0, scale: 0.99, filter: 'blur(10px)' }}
               animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
               exit={{ opacity: 0, scale: 1.01, filter: 'blur(10px)' }}
               transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
               className="flex-1 h-full w-full"
             >
                {activeTab === 'flow' && (
                  <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onNodeClick={onNodeClick}
                    onPaneClick={onPaneClick}
                    nodeTypes={nodeTypes}
                    fitView
                  >
                    <Background color="#111" gap={24} size={1} />
                    <Controls className="!bg-zinc-900 !border-white/10 !fill-white glass" />
                    <Panel position="top-right" className="p-2 space-x-2">
                       <button className="glass px-4 py-2 rounded-xl text-[11px] font-bold border-white/10 hover:bg-white/5">Auto Layout</button>
                       <button 
                        onClick={async () => {
                          const res = await fetch('/api/config/commit', { method: 'POST' });
                          if(res.ok) alert('Configuration committed to disk.');
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[11px] font-bold shadow-lg shadow-blue-600/20"
                       >
                         Commit Changes
                       </button>
                    </Panel>
                  </ReactFlow>
                )}
                {activeTab === 'trace' && <div className="p-8 h-full"><TracePanel /></div>}
                {activeTab === 'search' && (
                  <div className="h-full flex flex-col p-8 overflow-hidden">
                     <div className="max-w-3xl mx-auto w-full flex flex-col h-full">
                        {/* Omni Search Bar */}
                        <form onSubmit={handleSearch} className="mb-10">
                          <div className="glass p-6 rounded-[2.5rem] shadow-2xl flex items-center gap-5 border-border/50 group focus-within:border-blue-500/50 transition-all">
                             <Search className={cn("text-zinc-500 transition-colors", isSearching && "animate-pulse text-blue-400")} size={24} />
                             <input 
                                autoFocus
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search anything from your digital brain..." 
                                className="bg-transparent border-none outline-none text-xl w-full placeholder:text-zinc-700 font-medium"
                             />
                          </div>
                        </form>

                        {/* Results */}
                        <div className="flex-1 overflow-auto space-y-6 pb-10 pr-2">
                           {searchResults.length === 0 && !isSearching && (
                              <div className="h-full flex flex-col items-center justify-center opacity-20 grayscale">
                                 <Globe size={80} strokeWidth={1} />
                                 <p className="mt-4 font-mono text-sm uppercase tracking-widest">Global Bus Standby</p>
                              </div>
                           )}
                           {searchResults.map((item, i) => (
                              <AssetCard key={i} item={item} />
                           ))}
                        </div>
                     </div>
                  </div>
                )}
                
                {activeTab === 'assets' && (
                   <div className="p-10 h-full overflow-auto space-y-10">
                      <div className="max-w-5xl mx-auto">
                        <h2 className="text-4xl font-bold tracking-tighter mb-8">Memory Matrix</h2>
                        <div className="grid grid-cols-2 gap-6 pb-20">
                           {assets.length === 0 && <p className="text-zinc-500 italic font-mono text-sm">No records found yet...</p>}
                           {assets.map((asset, i) => (
                             <AssetCard key={i} item={asset} />
                           ))}
                        </div>
                      </div>
                   </div>
                )}
             </motion.div>
           </AnimatePresence>

           {/* 侧边属性面板 */}
           <AnimatePresence>
             {selectedNodeId && (
               <PropertyPanel 
                 node={nodes.find(n => n.id === selectedNodeId)} 
                 tools={sysInfo.tools}
                 onSave={updateNodeInput}
               />
             )}
           </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default App;
        </div>
                   </div>
                )}
             </motion.div>
           </AnimatePresence>

           {/* 侧边属性面板 */}
           <AnimatePresence>
             {selectedNodeId && (
               <PropertyPanel 
                 node={nodes.find(n => n.id === selectedNodeId)} 
                 tools={sysInfo.tools}
                 onSave={updateNodeInput}
               />
             )}
           </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default App;
