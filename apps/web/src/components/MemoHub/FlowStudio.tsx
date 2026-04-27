import React, { useState, useCallback, useEffect, useMemo } from 'react';
import ReactFlow, { Background, Controls, Panel, useNodesState, useEdgesState, MarkerType, NodeProps, Handle, Position } from 'reactflow';
import 'reactflow/dist/style.css';
import { Box, Settings, Cpu, Layers, Save, Activity } from 'lucide-react';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

const ToolNode = ({ data, selected }: NodeProps) => (
  <div className={cn(
    "px-5 py-4 rounded-[1.2rem] glass min-w-[180px] border shadow-xl bg-white dark:bg-zinc-900",
    selected ? "border-blue-500 ring-2 ring-blue-500/10" : "border-zinc-200 dark:border-zinc-800"
  )}>
    <Handle type="target" position={Position.Top} className="!bg-zinc-400 border-none" />
    <div className="flex items-center gap-3">
      <div className={cn("p-2 rounded-lg bg-blue-500/10 text-blue-500")}>
        <Cpu size={16} />
      </div>
      <div className="flex flex-col overflow-hidden">
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest truncate">{data.step}</span>
        <span className="text-xs font-bold truncate">{data.tool}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} className="!bg-zinc-400 border-none" />
  </div>
);

const FlowStudio = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [tracks, setTracks] = useState([]);
  const [activeTrack, setActiveTrace] = useState('');

  useEffect(() => {
    fetch('/api/inspect')
      .then(res => res.json())
      .then(data => {
        setTracks(data.tracks || []);
        if (data.tracks?.length > 0) {
           setActiveTrace(data.tracks[0].id);
           mapFlowToGraph(data.tracks[0], 'ADD');
        }
      });
  }, []);

  const mapFlowToGraph = (track: any, op: string) => {
    const flow = track.flows?.[op] || [];
    const newNodes = flow.map((step: any, i: number) => ({
      id: `${track.id}-${op}-${i}`,
      type: 'tool',
      position: { x: 250, y: i * 140 },
      data: { step: step.step, tool: step.tool, input: step.input }
    }));
    const newEdges = newNodes.slice(0, -1).map((n: any, i: number) => ({
      id: `e-${i}`, source: n.id, target: newNodes[i+1].id, animated: true,
      style: { stroke: '#3b82f6', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' }
    }));
    setNodes(newNodes);
    setEdges(newEdges);
  };

  return (
    <div className="h-full w-full flex flex-col bg-white dark:bg-zinc-950">
       <div className="h-16 border-b dark:border-white/5 flex items-center justify-between px-6 bg-zinc-50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-4">
             <Layers className="text-blue-500" size={20} />
             <h2 className="font-bold text-sm tracking-tight">Memory Orchestration Studio</h2>
             <select 
               value={activeTrack}
               onChange={(e) => {
                 const t = tracks.find((tr:any) => tr.id === e.target.value);
                 if(t) { setActiveTrace(t.id); mapFlowToGraph(t, 'ADD'); }
               }}
               className="bg-transparent border border-zinc-200 dark:border-zinc-800 rounded px-3 py-1 text-xs outline-none"
             >
               {tracks.map((t:any) => <option key={t.id} value={t.id}>{t.name}</option>)}
             </select>
          </div>
          <button className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded-md text-xs font-bold shadow-lg shadow-blue-600/20">
             <Save size={14} /> Commit Flow
          </button>
       </div>
       <div className="flex-1">
          <ReactFlow 
            nodes={nodes} edges={edges} 
            onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} 
            nodeTypes={{ tool: ToolNode }}
            fitView
          >
            <Background color="#ccc" gap={20} />
            <Controls />
          </ReactFlow>
       </div>
    </div>
  );
};

export default FlowStudio;
