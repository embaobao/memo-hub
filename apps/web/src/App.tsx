import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
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
  Plus, Terminal, Globe, Send, Layers, Share2, ShieldAlert, ArrowRightLeft, GitMerge, Check, X
} from 'lucide-react';
import { TracePanel, AgentSandbox } from './components/Sandbox';
import { ClarifyCenter, RelationGraph } from './components/Clarify';

// --- 工具函数 ---
const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

// --- Ether UI 节点定制 ---
const ToolNode = ({ data, selected }: NodeProps) => {
  const isBuiltin = data.tool?.startsWith('builtin:');
  const isTrack = data.tool?.includes(':') && !isBuiltin;

  return (
    <div className={cn(
      "px-5 py-4 rounded-[2rem] glass min-w-[220px] transition-all duration-700 border shadow-2xl",
      selected ? "border-blue-500 ring-4 ring-blue-500/10 scale-105" : "border-white/5",
      data.isRunning && "animate-pulse-glow border-emerald-500"
    )}>
      <Handle type="target" position={Position.Top} className="!bg-zinc-800 !w-3 !h-3 border-none" />
      <div className="flex items-center gap-4">
        <div className={cn(
          "p-3 rounded-2xl",
          isBuiltin ? "bg-blue-500/10 text-blue-400" : isTrack ? "bg-purple-500/10 text-purple-400" : "bg-emerald-500/10 text-emerald-400"
        )}>
          {isBuiltin ? <Cpu size={20} /> : isTrack ? <Layers size={20} /> : <Zap size={20} />}
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest truncate">{data.step}</span>
          <span className="text-sm font-bold truncate text-white">{data.tool}</span>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-zinc-800 !w-3 !h-3 border-none" />
    </div>
  );
};

const nodeTypes = { tool: ToolNode };

// --- 资产卡片 ---
const AssetCard = ({ item }: { item: any }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-6 rounded-[2.5rem] group cursor-pointer hover:border-blue-500/20 transition-all border border-white/5">
    <div className="flex justify-between items-center mb-4">
      <span className="px-3 py-1 rounded-full bg-white/5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{item.trackId}</span>
      <span className="text-[10px] text-zinc-600 font-mono italic">{new Date(item.timestamp).toLocaleDateString()}</span>
    </div>
    <p className="text-sm line-clamp-3 text-zinc-300 leading-relaxed font-medium mb-4">{item.text || item.content}</p>
    <div className="flex flex-wrap gap-2">
       {(item.entities || []).map((e: string) => (
         <span key={e} className="text-[9px] px-2.5 py-1 rounded-full bg-blue-500/5 text-blue-400 border border-blue-500/10">{e}</span>
       ))}
    </div>
  </motion.div>
);

// --- 侧边工具箱 ---
const ToolPalette = ({ tools }: { tools: any[] }) => {
  const onDragStart = (event: React.DragEvent, toolId: string) => {
    event.dataTransfer.setData('application/reactflow', toolId);
    event.dataTransfer.effectAllowed = 'move';
  };
  return (
    <div className="w-56 glass border-r border-white/5 p-6 flex flex-col gap-5 overflow-auto z-40 bg-black/20 backdrop-blur-3xl">
      <span className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.2em] mb-2">Atomic Nodes</span>
      {tools.map(tool => (
        <div key={tool.id} draggable onDragStart={(e) => onDragStart(e, tool.id)} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-blue-500/40 cursor-grab active:cursor-grabbing transition-all group hover:bg-white/[0.05]">
          <div className="flex items-center gap-3 text-zinc-400 group-hover:text-white">
            <Cpu size={16} className="text-blue-500" />
            <span className="text-xs font-bold truncate">{tool.id.replace('builtin:', '')}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// --- 手动录入弹窗 ---
const EntryModal = ({ isOpen, onClose, onAdd }: { isOpen: boolean, onClose: () => void, onAdd: (data: any) => void }) => {
  const [text, setText] = useState('');
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass p-12 rounded-[3.5rem] max-w-xl w-full border-white/10 shadow-2xl bg-black">
        <h2 className="text-3xl font-black mb-8 text-white italic tracking-tighter">Inject Memory</h2>
        <textarea autoFocus value={text} onChange={e => setText(e.target.value)} placeholder="Paste content to distill..." className="w-full h-56 bg-white/5 border border-white/5 rounded-3xl p-8 text-base outline-none focus:border-blue-500/40 transition-all text-zinc-200 mb-8 font-mono" />
        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 py-4.5 glass rounded-2xl text-xs font-black uppercase tracking-widest text-zinc-600 hover:text-zinc-400">Cancel</button>
          <button onClick={() => { onAdd({ text }); setText(''); onClose(); }} className="flex-1 py-4.5 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl shadow-blue-600/30 active:scale-95">Inject</button>
        </div>
      </motion.div>
    </div>
  );
};

// --- 属性面板 ---
const PropertyPanel = ({ node, tools, onSave }: { node: any, tools: any[], onSave: (id: string, data: any) => void }) => {
  const [formData, setFormData] = useState(node.data.input || {});
  useEffect(() => { setFormData(node.data.input || {}); }, [node.id]);
  return (
    <motion.div initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }} className="w-96 glass border-l border-white/5 p-10 h-full flex flex-col z-50 bg-black/60 backdrop-blur-3xl shadow-2xl">
      <h3 className="text-xl font-bold mb-10 text-white flex items-center gap-3"><Settings size={20} className="text-blue-500" />Node Control</h3>
      <div className="flex-1 space-y-8 overflow-auto">
        <div className="space-y-4">
          <label className="text-[10px] text-zinc-600 uppercase font-black tracking-widest">Tool Identity</label>
          <div className="p-5 rounded-2xl bg-white/5 border border-white/5 font-mono text-xs text-blue-400 shadow-inner">{node.data.tool}</div>
        </div>
        <div className="space-y-4 pt-4 border-t border-white/5">
           <label className="text-[10px] text-zinc-600 uppercase font-black tracking-widest">Input Mapping</label>
           {Object.keys(formData).map(key => (
             <div key={key} className="group">
               <span className="text-[11px] text-zinc-500 font-mono mb-2 block">{key}</span>
               <input value={formData[key]} onChange={(e) => setFormData({ ...formData, [key]: e.target.value })} className="w-full bg-white/5 border border-white/5 group-focus-within:border-blue-500/40 rounded-2xl px-6 py-4 text-xs outline-none transition-all text-zinc-200" />
             </div>
           ))}
        </div>
      </div>
      <button onClick={() => onSave(node.id, formData)} className="mt-10 w-full py-5 bg-blue-600 text-white rounded-[2rem] font-bold text-sm shadow-2xl shadow-blue-600/30 active:scale-95 transition-all">Update Memory Flow</button>
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
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      const [metaRes, wsRes] = await Promise.all([fetch('/api/inspect'), fetch('/api/workspaces')]);
      const meta = await metaRes.json();
      const wsData = await wsRes.json();
      setSysInfo(meta);
      setWorkspaces(wsData.workspaces || ['default']);
      if (meta.tracks?.length > 0) mapFlowToGraph(meta.tracks[0], 'ADD');
      setIsLoaded(true);
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

  useEffect(() => { if (activeTab === 'assets') fetch('/api/assets').then(r => r.json()).then(d => setAssets(d.items || [])); }, [activeTab]);

  const onDragOver = useCallback((e: any) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }, []);
  const onDrop = useCallback((e: any) => {
    e.preventDefault();
    const toolId = e.dataTransfer.getData('application/reactflow');
    if (!toolId) return;
    const position = { x: Math.random() * 400, y: Math.random() * 400 };
    setNodes(nds => nds.concat({ id: `node-${Date.now()}`, type: 'tool', position, data: { step: `step_${nds.length+1}`, tool: toolId, input: {} } }));
  }, [nodes]);

  const handleSearch = async (e: any) => {
    e.preventDefault();
    setIsSearching(true);
    const res = await fetch('/api/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: searchQuery }) });
    const data = await res.json();
    setSearchResults(data.data || []);
    setIsSearching(false);
  };

  const mapFlowToGraph = (track: any, op: string) => {
    const flow = track.flows?.[op] || [];
    const newNodes = flow.map((step: any, i: number) => ({ id: `${track.id}-${op}-${i}`, type: 'tool', position: { x: 250, y: i * 180 }, data: { step: step.step, tool: step.tool, input: step.input } }));
    const newEdges = newNodes.slice(0, -1).map((n: any, i: number) => ({ id: `e-${i}`, source: n.id, target: newNodes[i+1].id, animated: true, style: { stroke: '#3b82f6', strokeWidth: 4 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' } }));
    setNodes(newNodes);
    setEdges(newEdges);
  };

  const processedNodes = useMemo(() => nodes.map(n => ({ ...n, data: { ...n.data, isRunning: activeTraceNode === n.id.split('-')[0] } })), [nodes, activeTraceNode]);

  if (!isLoaded) return <div className="h-screen w-screen bg-black flex items-center justify-center font-mono text-blue-500 animate-pulse uppercase tracking-[0.4em]">Booting Memory OS...</div>;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-black text-zinc-100 selection:bg-blue-500/40">
      <div className="noise-overlay" />
      <aside className="w-72 glass border-r border-white/5 flex flex-col z-50">
        <div className="p-12"><div className="flex items-center gap-4"><div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-emerald-400 shadow-2xl flex items-center justify-center"><Zap size={22} className="text-white fill-white" /></div><span className="font-black tracking-tighter text-2xl">MemoHub</span></div></div>
        <nav className="flex-1 px-6 space-y-2">
          {[
            { id: 'flow', icon: <Box size={20} />, label: 'Studio' }, 
            { id: 'search', icon: <Globe size={20} />, label: 'Sandbox' }, 
            { id: 'assets', icon: <Database size={20} />, label: 'Matrix' }, 
            { id: 'clarify', icon: <ShieldAlert size={20} />, label: 'Clarify' }, 
            { id: 'trace', icon: <Activity size={20} />, label: 'Log Stream' }
          ].map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={cn("w-full flex items-center gap-6 px-6 py-5 rounded-[1.5rem] transition-all duration-500 group relative", activeTab === item.id ? 'bg-white/5 text-white' : 'text-zinc-600 hover:text-zinc-200')}>
              <span className={activeTab === item.id ? 'scale-110 text-blue-500' : 'group-hover:scale-110'}>{item.icon}</span>
              <span className="font-bold text-sm tracking-tight">{item.label}</span>
              {activeTab === item.id && <motion.div layoutId="nav" className="absolute left-0 w-1.5 h-8 rounded-full bg-blue-600" />}
            </button>
          ))}
        </nav>
        <div className="p-8"><div className="glass p-6 rounded-[2.5rem] border-emerald-500/10 bg-emerald-500/5"><div className="flex items-center gap-3 mb-1"><div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse glow" /><span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Live Kernel</span></div><p className="text-[9px] text-zinc-700 font-mono italic">Node: darwin-arm64-v1</p></div></div>
      </aside>

      <main className="flex-1 relative flex flex-col overflow-hidden">
        <header className="h-28 flex items-center justify-between px-14 border-b border-white/5 z-40 bg-black/40 backdrop-blur-3xl">
           <div className="flex items-center gap-4"><History size={18} className="text-zinc-700" /><div className="text-xs font-bold uppercase tracking-widest text-zinc-600">Workspaces / <select value={activeWorkspace} onChange={e => setActiveWorkspace(e.target.value)} className="bg-transparent border-none outline-none text-white font-bold ml-2 cursor-pointer hover:underline">{workspaces.map(w => <option key={w} value={w}>{w}</option>)}</select></div><ChevronRight size={14} className="text-zinc-800" /><div className="text-xs font-bold uppercase tracking-widest text-zinc-600">Active / <select className="bg-transparent border-none outline-none text-blue-500 ml-2 cursor-pointer" onChange={(e) => { const t = sysInfo.tracks.find((t: any) => t.id === e.target.value); if(t) mapFlowToGraph(t, 'ADD'); }}>{sysInfo.tracks.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div></div>
           <div className="flex items-center gap-8"><div className="flex items-center gap-3 text-[10px] font-black text-zinc-500 bg-white/5 px-6 py-3 rounded-2xl border border-white/5 uppercase tracking-widest"><ShieldCheck size={16} className="text-emerald-500" /><span>Encrypted</span></div><button onClick={() => setIsEntryModalOpen(true)} className="h-14 w-14 rounded-full glass border border-white/10 flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-2xl shadow-white/5"><Plus size={24} /></button></div>
        </header>

        <div className="flex-1 relative flex">
           <AnimatePresence mode="wait">
             <motion.div key={activeTab} initial={{ opacity: 0, scale: 0.99, filter: 'blur(30px)' }} animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }} exit={{ opacity: 0, scale: 1.01, filter: 'blur(30px)' }} transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }} className="flex-1 h-full w-full">
                {activeTab === 'flow' && (
                  <div className="flex h-full w-full" ref={reactFlowWrapper}>
                    <ToolPalette tools={sysInfo.tools} />
                    <ReactFlow nodes={processedNodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onNodeClick={(_, n) => setSelectedNodeId(n.id)} onPaneClick={() => setSelectedNodeId(null)} onDragOver={onDragOver} onDrop={onDrop} nodeTypes={nodeTypes} fitView>
                      <Background color="#111" gap={40} size={2} />
                      <Controls className="glass !bg-zinc-900 !border-white/10 !fill-white" />
                      <Panel position="top-right" className="p-6 space-x-4"><button className="glass px-8 py-3 rounded-2xl text-xs font-black border-white/5 hover:bg-white/5 uppercase tracking-widest shadow-2xl">Layout</button><button onClick={() => fetch('/api/config/commit', { method: 'POST' }).then(() => alert('Persisted.'))} className="bg-blue-600 text-white px-8 py-3 rounded-2xl text-xs font-black shadow-2xl shadow-blue-600/40 uppercase tracking-widest">Commit</button></Panel>
                    </ReactFlow>
                  </div>
                )}
                {activeTab === 'trace' && <div className="p-14 h-full"><TracePanel logs={logs} /></div>}
                {activeTab === 'clarify' && <div className="p-14 h-full overflow-auto"><ClarifyCenter /></div>}
                {activeTab === 'search' && (
                   <div className="h-full flex flex-col p-14 max-w-6xl mx-auto w-full">
                      <form onSubmit={handleSearch} className="mb-14"><div className="glass p-10 rounded-[3.5rem] shadow-2xl flex items-center gap-8 border-white/5 focus-within:border-blue-500/40 transition-all"><Search className={cn("text-zinc-800", isSearching && "animate-pulse text-blue-500")} size={32} /><input autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search digital brain..." className="bg-transparent border-none outline-none text-3xl w-full placeholder:text-zinc-900 font-black tracking-tight" /></div></form>
                      <AgentSandbox />
                   </div>
                )}
                {activeTab === 'assets' && (
                   <div className="p-14 h-full overflow-auto space-y-12">
                      <div className="max-w-6xl mx-auto"><h2 className="text-6xl font-black tracking-tighter mb-16 text-white italic opacity-90">Memory Matrix</h2><div className="grid grid-cols-2 gap-10 pb-48">{assets.map((asset, i) => <div key={i} onClick={() => setSelectedAsset(asset)}><AssetCard item={asset} /></div>)}</div></div>
                   </div>
                )}
             </motion.div>
           </AnimatePresence>
           <AnimatePresence>
             {selectedNodeId && <PropertyPanel node={nodes.find(n => n.id === selectedNodeId)} tools={sysInfo.tools} onSave={(id, data) => { setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, input: data } } : n)); fetch('/api/config/shadow', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ trackId: id.split('-')[0], op: id.split('-')[1], flow: nodes.map(n => n.data) }) }); }} />}
             {selectedAsset && (
               <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 35, stiffness: 180 }} className="absolute right-0 top-0 bottom-0 w-[600px] glass z-[60] border-l border-white/5 p-16 flex flex-col bg-black/90 backdrop-blur-3xl shadow-2xl">
                  <div className="flex justify-between items-center mb-16"><span className="text-[11px] font-black text-blue-500 uppercase tracking-[0.5em]">{selectedAsset.trackId}</span><button onClick={() => setSelectedAsset(null)} className="text-zinc-700 hover:text-white transition-colors text-xs font-black uppercase tracking-widest">Close</button></div>
                  <h3 className="text-4xl font-black mb-12 text-white leading-tight italic">{selectedAsset.title || 'Fragment'}</h3>
                  <div className="flex-1 overflow-auto space-y-12 pr-6">
                     {selectedAsset.trackId === 'track-wiki' && (
                        <div className="space-y-6 mb-10">
                           <span className="text-[10px] text-zinc-800 font-black uppercase tracking-widest block">ENTITY_GRAPH</span>
                           <RelationGraph entity={selectedAsset.title || selectedAsset.id} />
                        </div>
                     )}
                     <div className="space-y-6"><span className="text-[10px] text-zinc-800 font-black uppercase tracking-widest block">RAW_CONTENT</span><div className="p-10 rounded-[3rem] bg-white/[0.01] border border-white/5 text-lg leading-relaxed text-zinc-400 font-mono italic shadow-inner">{selectedAsset.text || selectedAsset.content}</div></div>
                  </div>
               </motion.div>
             )}
           </AnimatePresence>
        </div>
        <EntryModal isOpen={isEntryModalOpen} onClose={() => setIsEntryModalOpen(false)} onAdd={async (data) => { const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: `Add this to memory: ${data.text}` }) }); if(res.ok) alert('Injection requested.'); }} />
      </main>
    </div>
  );
};

export default App;
