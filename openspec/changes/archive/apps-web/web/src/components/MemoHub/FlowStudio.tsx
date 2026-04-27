import React, { useState, useCallback, useEffect, useMemo } from 'react';
import ReactFlow, { Background, Controls, Panel, useNodesState, useEdgesState, MarkerType, NodeProps, Handle, Position } from 'reactflow';
import 'reactflow/dist/style.css';
import { Box, Settings, Cpu, Layers, Save, Activity } from 'lucide-react';
import { Button, Label, useToastContext } from '@librechat/client';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

/**
 * 编排节点 - 对齐 LibreChat 卡片样式
 */
const ToolNode = ({ data, selected }: NodeProps) => (
  <div className={cn(
    "px-4 py-3 rounded-xl border shadow-sm transition-all duration-300 bg-surface-primary",
    selected ? "border-blue-500 ring-2 ring-blue-500/10 scale-105" : "border-border-light dark:border-border-heavy"
  )}>
    <Handle type="target" position={Position.Top} className="!bg-border-heavy border-none !w-2 !h-2" />
    <div className="flex items-center gap-3">
      <div className={cn("p-1.5 rounded-lg bg-surface-secondary text-blue-500 border border-border-light")}>
        <Cpu size={14} />
      </div>
      <div className="flex flex-col overflow-hidden">
        <span className="text-[9px] font-mono text-text-secondary uppercase tracking-widest truncate leading-none mb-1">{data.step}</span>
        <span className="text-xs font-bold truncate text-text-primary">{data.tool}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} className="!bg-border-heavy border-none !w-2 !h-2" />
  </div>
);

const FlowStudio = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [tracks, setTracks] = useState([]);
  const [activeTrack, setActiveTrack] = useState('');
  const { showToast } = useToastContext();

  useEffect(() => {
    fetch('/api/inspect')
      .then(res => res.json())
      .then(data => {
        setTracks(data.tracks || []);
        if (data.tracks?.length > 0) {
           setActiveTrack(data.tracks[0].id);
           mapFlowToGraph(data.tracks[0], 'ADD');
        }
      });
  }, []);

  const mapFlowToGraph = (track: any, op: string) => {
    const flow = track.flows?.[op] || [];
    const newNodes = flow.map((step: any, i: number) => ({
      id: `${track.id}-${op}-${i}`,
      type: 'tool',
      position: { x: 250, y: i * 120 },
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

  const handleCommit = () => {
    fetch('/api/config/commit', { method: 'POST' })
      .then(() => showToast({ message: 'Orchestration committed to disk.', status: 'success' }))
      .catch(() => showToast({ message: 'Failed to commit.', status: 'error' }));
  };

  return (
    <div className="h-screen w-full flex flex-col bg-surface-primary overflow-hidden">
       <div className="h-14 border-b border-border-light dark:border-border-heavy flex items-center justify-between px-6 bg-surface-secondary/50 backdrop-blur-sm">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2">
                <Layers className="text-blue-500" size={18} />
                <h2 className="font-bold text-sm tracking-tight text-text-primary">Studio</h2>
             </div>
             <div className="h-6 w-[1px] bg-border-light mx-2" />
             <select 
               value={activeTrack}
               onChange={(e) => {
                 const t = tracks.find((tr:any) => tr.id === e.target.value);
                 if(t) { setActiveTrack(t.id); mapFlowToGraph(t, 'ADD'); }
               }}
               className="bg-transparent border border-border-light dark:border-border-heavy rounded-md px-3 py-1 text-xs outline-none focus:ring-1 focus:ring-blue-500 text-text-primary cursor-pointer hover:bg-surface-primary transition-colors"
             >
               {tracks.map((t:any) => <option key={t.id} value={t.id} className="bg-surface-primary text-text-primary">{t.name}</option>)}
             </select>
          </div>
          <Button 
            onClick={handleCommit}
            variant="primary"
            className="h-8 px-4 flex items-center gap-2 text-xs font-bold"
          >
             <Save size={14} /> Commit Changes
          </Button>
       </div>
       <div className="flex-1 relative">
          <ReactFlow 
            nodes={nodes} edges={edges} 
            onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} 
            nodeTypes={{ tool: ToolNode }}
            fitView
            className="bg-dot-pattern"
          >
            <Background color="var(--border-light)" gap={24} size={1} />
            <Controls className="!bg-surface-primary !border-border-light !fill-text-primary shadow-lg" />
          </ReactFlow>
       </div>
    </div>
  );
};

export default FlowStudio;
