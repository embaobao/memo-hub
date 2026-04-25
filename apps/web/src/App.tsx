import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import ReactFlow, { Background, Controls, Panel, useNodesState, useEdgesState, addEdge, MarkerType, NodeProps, Handle, Position } from 'reactflow';
import 'reactflow/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Search, Database, Activity, Settings, Cpu, Zap, ChevronRight, History, ShieldCheck, Plus, Terminal, Globe, Send, Layers, ShieldAlert, ArrowRightLeft, GitMerge, Check, X } from 'lucide-react';
import { TracePanel, AgentSandbox } from './components/Sandbox';
import { ClarifyCenter, RelationGraph } from './components/Clarify';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

// --- 节点定制 ---
const ToolNode = ({ data, selected }: NodeProps) => (
  <div className={cn("px-5 py-4 rounded-[1.5rem] glass min-w-[200px] transition-all duration-700 border shadow-2xl", selected ? "border-blue-500 ring-4 ring-blue-500/10 scale-105" : "border-white/5", data.isRunning && "animate-pulse border-emerald-500")}>
    <Handle type="target" position={Position.Top} className="!bg-zinc-800 border-none" />
    <div className="flex items-center gap-3">
      <div className={cn("p-2.5 rounded-xl", data.tool?.startsWith('builtin:') ? "bg-blue-500/10 text-blue-400" : "bg-purple-500/10 text-purple-400")}>
        {data.tool?.startsWith('builtin:') ? <Cpu size={18} /> : <Layers size={18} />}
      </div>
      <div className="flex flex-col overflow-hidden">
        <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest truncate">{data.step}</span>
        <span className="text-xs font-bold truncate text-white">{data.tool}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} className="!bg-zinc-800 border-none" />
  </div>
);

const AssetCard = ({ item, onClick }: { item: any, onClick?: () => void }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onClick={onClick} className="glass p-6 rounded-[2.5rem] group cursor-pointer hover:border-blue-500/20 transition-all border border-white/5">
    <div className="flex justify-between items-center mb-4"><span className="px-3 py-1 rounded-full bg-white/5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{item.trackId}</span><span className="text-[10px] text-zinc-600 font-mono italic">{new Date(item.timestamp).toLocaleDateString()}</span></div>
    <p className="text-sm line-clamp-3 text-zinc-300 leading-relaxed font-medium mb-4">{item.text || item.content}</p>
    <div className="flex flex-wrap gap-2">{(item.entities || []).map((e: string) => <span key={e} className="text-[9px] px-2 py-1 rounded-full bg-blue-500/5 text-blue-400 border border-blue-500/10">{e}</span>)}</div>
  </motion.div>
);

const App = () => {
  const [activeTab, setActiveTab] = useState('flow');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [sysInfo, setSysInfo] = useState({ tracks: [], tools: [], config: {} });
  const [isLoaded, setIsLoaded] = useState(false);
  const [assets, setAssets] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [activeTraceNode, setActiveTraceNode] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [workspaces, setWorkspaces] = useState<string[]>(['default']);
  const [activeWorkspace, setActiveWorkspace] = useState('default');

  useEffect(() => {
    const init = async () => {
      try {
        const [metaRes, wsRes] = await Promise.all([fetch('/api/inspect'), fetch('/api/workspaces')]);
        const meta = await metaRes.json();
        const wsData = await wsRes.json();
        setSysInfo(meta);
        setWorkspaces(wsData.workspaces || ['default']);
        if (meta.tracks?.length > 0) mapFlowToGraph(meta.tracks[0], 'ADD');
        setIsLoaded(true);
      } catch (e) {
        setIsLoaded(true); // 即使失败也进入 UI，让导航可见
      }
    };
    init();
    const ws = new WebSocket(`ws://${window.location.host}/ws/trace`);
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'KERNEL_EVENT') {
        setLogs(prev => [{ ...data.payload, time: new Date(data.timestamp).toLocaleTimeString() }, ...prev].slice(0, 100));
        if (data.payload.stage === 'start') {
          setActiveTraceNode(data.payload.trackId);
          setTimeout(() => setActiveTraceNode(null), 2000);
        }
      }
    };
    return () => ws.close();
  }, []);

  const mapFlowToGraph = (track: any, op: string) => {
    const flow = track.flows?.[op] || [];
    const newNodes = flow.map((step: any, i: number) => ({ id: `${track.id}-${op}-${i}`, type: 'tool', position: { x: 250, y: i * 150 }, data: { step: step.step, tool: step.tool, input: step.input } }));
    const newEdges = newNodes.slice(0, -1).map((n: any, i: number) => ({ id: `e-${i}`, source: n.id, target: newNodes[i+1].id, animated: true, style: { stroke: '#3b82f6', strokeWidth: 3 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' } }));
    setNodes(newNodes);
    setEdges(newEdges);
  };

  const processedNodes = useMemo(() => nodes.map(n => ({ ...n, data: { ...n.data, isRunning: activeTraceNode === n.id.split('-')[0] } })), [nodes, activeTraceNode]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#000] text-zinc-100">
      <div className="noise-overlay" />
      
      {/* 侧边栏始终存在 */}
      <aside className="w-72 glass border-r border-white/5 flex flex-col z-50">
        <div className="p-10 flex items-center gap-4">
           <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-emerald-400 shadow-2xl flex items-center justify-center"><Zap size={22} className="text-white fill-white" /></div>
           <span className="font-black tracking-tighter text-2xl">MemoHub</span>
        </div>
        <nav className="flex-1 px-6 space-y-2">
          {[
            { id: 'flow', icon: <Box size={20} />, label: 'Studio' }, 
            { id: 'search', icon: <Globe size={20} />, label: 'Sandbox' }, 
            { id: 'assets', icon: <Database size={20} />, label: 'Matrix' }, 
            { id: 'trace', icon: <Activity size={20} />, label: 'Logs' }
          ].map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={cn("w-full flex items-center gap-6 px-6 py-5 rounded-[1.5rem] transition-all duration-500 group relative", activeTab === item.id ? 'bg-white/5 text-white' : 'text-zinc-600 hover:text-zinc-200')}>
              <span className={activeTab === item.id ? 'scale-110 text-blue-500' : 'group-hover:scale-110'}>{item.icon}</span>
              <span className="font-bold text-sm tracking-tight">{item.label}</span>
              {activeTab === item.id && <motion.div layoutId="nav" className="absolute left-0 w-1.5 h-8 rounded-full bg-blue-600" />}
            </button>
          ))}
        </nav>
      </aside>

      {/* 内容区 */}
      <main className="flex-1 relative flex flex-col overflow-hidden">
        <header className="h-24 flex items-center justify-between px-12 border-b border-white/5 z-40 bg-black/40 backdrop-blur-3xl">
           <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-zinc-600">Workspaces / <span className="text-white">{activeWorkspace}</span></div>
           <div className="flex items-center gap-8"><button onClick={() => setIsEntryModalOpen(true)} className="h-12 w-12 rounded-full glass border border-white/10 flex items-center justify-center hover:scale-110 transition-all"><Plus size={20} /></button></div>
        </header>

        {!isLoaded ? (
          <div className="flex-1 flex items-center justify-center font-mono text-blue-500 animate-pulse uppercase tracking-[0.3em]">Booting Memory OS...</div>
        ) : (
          <div className="flex-1 relative">
             <AnimatePresence mode="wait">
                <motion.div key={activeTab} className="h-full w-full">
                    {activeTab === 'flow' && <ReactFlow nodes={processedNodes} edges={edges} nodeTypes={{ tool: ToolNode }} fitView className="h-full w-full"><Background color="#111" gap={30} size={1} /></ReactFlow>}
                    {activeTab === 'trace' && <div className="p-12 h-full"><TracePanel logs={logs} /></div>}
                    {activeTab === 'search' && <div className="p-12 h-full"><AgentSandbox /></div>}
                    {activeTab === 'assets' && <div className="p-12 h-full overflow-auto"><div className="max-w-5xl mx-auto grid grid-cols-2 gap-6">{assets.map((asset, i) => <AssetCard key={i} item={asset} />)}</div></div>}
                </motion.div>
             </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
