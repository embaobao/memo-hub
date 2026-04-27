import React, { useState, useCallback, useMemo, useEffect } from 'react';
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
  Position,
  Connection,
  Edge
} from 'reactflow';
import 'reactflow/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box, Search, Database, Activity, Settings, Cpu, Zap, ChevronRight,
  Plus, Terminal, Layers, ShieldAlert, Save, Trash2, Edit2, X, Code, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';

// 注册的工具信息
interface Tool {
  id: string;
  name: string;
  description: string;
  category: 'builtin' | 'custom';
  config?: Record<string, any>;
}

// 轨道信息
interface Track {
  id: string;
  name: string;
  description: string;
  ops: string[];
  tools: string[];
  flows: Record<string, any[]>;
}

const iconMap: Record<string, React.ElementType> = {
  Database,
  Activity,
  Code,
  Search,
  Settings,
  Cpu,
  Zap,
  Layers,
  Terminal,
  ShieldAlert
};

// 节点组件
const ToolNode = ({ data, selected }: NodeProps) => {
  const tool = data.tool as Tool;

  return (
    <div className={cn(
      "px-5 py-4 rounded-xl glass min-w-[200px] transition-all duration-200 border shadow-lg cursor-move",
      selected ? "border-blue-500 ring-4 ring-blue-500/10 scale-105" : "border-white/5"
    )}>
      <Handle type="target" position={Position.Top} className="!bg-zinc-800 border-none" />
      <div className="flex items-center gap-3">
        <div className={cn(
          "p-2.5 rounded-lg",
          tool.category === 'builtin' ? "bg-blue-500/10 text-blue-400" : "bg-purple-500/10 text-purple-400"
        )}>
          <Cpu size={18} />
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest truncate">
            {tool.category}
          </span>
          <span className="text-xs font-bold truncate text-white">{tool.name}</span>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-zinc-800 border-none" />
    </div>
  );
};

// 默认工具
const DEFAULT_TOOLS: Tool[] = [
  { id: 'builtin:cass', name: 'CAS 存储', description: '内容寻址存储', category: 'builtin' },
  { id: 'builtin:vector', name: '向量操作', description: '向量数据库操作', category: 'builtin' },
  { id: 'builtin:embedder', name: '文本嵌入', description: '文本向量化', category: 'builtin' },
  { id: 'builtin:retriever', name: '检索器', description: '向量相似度检索', category: 'builtin' },
  { id: 'builtin:reranker', name: '重排序', description: '结果重排序优化', category: 'builtin' },
  { id: 'builtin:aggregator', name: '聚合器', description: '多源数据聚合', category: 'builtin' }
];

// 默认轨道
const DEFAULT_TRACKS: Track[] = [
  {
    id: 'track-insight',
    name: '知识轨道',
    description: '存储 LLM 提纯后的事实和结论',
    ops: ['ADD', 'RETRIEVE', 'UPDATE', 'DELETE', 'MERGE', 'LIST', 'EXPORT', 'DISTILL', 'ANCHOR', 'DIFF', 'SYNC'],
    tools: ['builtin:cass', 'builtin:vector', 'builtin:embedder', 'builtin:retriever'],
    flows: {
      'ADD': [
        { id: 'node-add-1', tool: 'builtin:cass', input: 'text_input' },
        { id: 'node-add-2', tool: 'builtin:embedder', input: 'embedding_input' },
        { id: 'node-add-3', tool: 'builtin:vector', input: 'vector_input' }
      ],
      'RETRIEVE': [
        { id: 'node-retrieve-1', tool: 'builtin:embedder', input: 'query_embedding' },
        { id: 'node-retrieve-2', tool: 'builtin:vector', input: 'vector_search' },
        { id: 'node-retrieve-3', tool: 'builtin:cass', input: 'content_retrieval' }
      ]
    }
  },
  {
    id: 'track-source',
    name: '源代码轨道',
    description: '代码库分析和理解',
    ops: ['ADD', 'RETRIEVE', 'UPDATE', 'DELETE'],
    tools: ['builtin:cass', 'builtin:embedder'],
    flows: {
      'ADD': [
        { id: 'node-source-add-1', tool: 'builtin:cass', input: 'code_storage' },
        { id: 'node-source-add-2', tool: 'builtin:embedder', input: 'code_embedding' }
      ]
    }
  }
];

interface ToolCardProps {
  tool: Tool;
  onEdit?: (tool: Tool) => void;
  onDelete?: (id: string) => void;
}

const ToolCard: React.FC<ToolCardProps> = ({ tool, onEdit, onDelete }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData('application/reactflow', JSON.stringify(tool));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className="p-4 rounded-xl border cursor-move transition-all hover:scale-[1.02]"
      style={{
        backgroundColor: 'var(--surface-secondary)',
        borderColor: isDragging ? 'var(--brand-purple)' : 'var(--border-light)',
        opacity: isDragging ? 0.5 : 1
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{
            backgroundColor: tool.category === 'builtin' ? 'var(--brand-purple)/20' : 'var(--brand-purple)/10',
            color: 'var(--brand-purple)'
          }}>
            <Cpu size={16} />
          </div>
          <div>
            <h4 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
              {tool.name}
            </h4>
            <p className="text-[10px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
              {tool.id}
            </p>
          </div>
        </div>
        {tool.category === 'custom' && (
          <div className="flex gap-1">
            {onEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(tool); }}
                className="p-1 rounded hover:bg-surface-hover"
                style={{ color: 'var(--text-secondary)' }}
              >
                <Edit2 size={12} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(tool.id); }}
                className="p-1 rounded hover:bg-surface-hover"
                style={{ color: 'var(--text-secondary)' }}
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        )}
      </div>
      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
        {tool.description}
      </p>
    </div>
  );
};

interface TrackFlowEditorProps {
  track: Track;
  tools: Tool[];
  onClose: () => void;
  onSave: (track: Track) => void;
}

const TrackFlowEditor: React.FC<TrackFlowEditorProps> = ({ track, tools, onClose, onSave }) => {
  const [selectedOp, setSelectedOp] = useState<string>(track.ops[0] || '');

  // 初始化节点和边
  const initialNodes = useMemo(() => {
    const flow = track.flows?.[selectedOp];
    if (!flow || flow.length === 0) return [];

    return flow.map((step: any, index: number) => {
      const tool = tools.find(t => t.id === step.tool);
      return {
        id: step.id || `${track.id}-${selectedOp}-${index}`,
        type: 'tool',
        position: { x: 250, y: index * 150 },
        data: { tool: tool || { id: step.tool, name: step.tool, description: 'Unknown tool', category: 'builtin' } }
      };
    });
  }, [track, selectedOp, tools]);

  const initialEdges = useMemo(() => {
    const flow = track.flows?.[selectedOp];
    if (!flow || flow.length === 0) return [];

    return flow.slice(0, -1).map((_: any, index: number) => ({
      id: `e-${index}`,
      source: `${track.id}-${selectedOp}-${index}`,
      target: `${track.id}-${selectedOp}-${index + 1}`,
      animated: true,
      style: { stroke: '#3b82f6', strokeWidth: 3 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' }
    }));
  }, [track, selectedOp]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // 当选中的操作改变时，重新加载流程
  useEffect(() => {
    const flow = track.flows?.[selectedOp];
    if (flow && flow.length > 0) {
      const newNodes = flow.map((step: any, index: number) => {
        const tool = tools.find(t => t.id === step.tool);
        return {
          id: step.id || `${track.id}-${selectedOp}-${index}`,
          type: 'tool',
          position: { x: 250, y: index * 150 },
          data: { tool: tool || { id: step.tool, name: step.tool, description: 'Unknown tool', category: 'builtin' } }
        };
      });

      const newEdges = flow.slice(0, -1).map((_: any, index: number) => ({
        id: `e-${selectedOp}-${index}`,
        source: flow[index].id || `${track.id}-${selectedOp}-${index}`,
        target: flow[index + 1].id || `${track.id}-${selectedOp}-${index + 1}`,
        animated: true,
        style: { stroke: '#3b82f6', strokeWidth: 3 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' }
      }));

      setNodes(newNodes);
      setEdges(newEdges);
    } else {
      setNodes([]);
      setEdges([]);
    }
  }, [selectedOp, track, tools, setNodes, setEdges]);

  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge({ ...params, animated: true }, eds));
  }, [setEdges]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();

    try {
      const tool = JSON.parse(e.dataTransfer.getData('application/reactflow'));
      const position = {
        x: e.clientX - 400,
        y: e.clientY - 200
      };

      const newNode = {
        id: `${tool.id}-${Date.now()}`,
        type: 'tool',
        position,
        data: { tool }
      };

      setNodes((nds) => [...nds, newNode]);
    } catch (err) {
      console.error('Failed to parse dragged data:', err);
    }
  }, [setNodes]);

  return (
    <div className="h-full flex flex-col">
      {/* 头部 */}
      <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-light)' }}>
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-hover"
            style={{ color: 'var(--text-secondary)' }}
          >
            <X size={20} />
          </button>
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {track.name}
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {track.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedOp}
            onChange={(e) => setSelectedOp(e.target.value)}
            className="px-3 py-2 rounded-lg bg-surface-tertiary border border-white/10 text-sm focus:outline-none"
            style={{ color: 'var(--text-primary)' }}
          >
            {track.ops.map(op => (
              <option key={op} value={op}>{op}</option>
            ))}
          </select>
          <button
            onClick={() => {
              const flowData = nodes.map(n => ({
                id: n.id,
                tool: n.data.tool.id,
                input: n.data.tool.id
              }));

              const updatedTrack = {
                ...track,
                flows: {
                  ...track.flows,
                  [selectedOp]: flowData
                }
              };

              console.log('Saving track:', updatedTrack);
              onSave(updatedTrack);
            }}
            className="px-4 py-2 rounded-lg font-bold text-white flex items-center gap-2"
            style={{ backgroundColor: 'var(--brand-purple)' }}
          >
            <Save size={16} />
            保存
          </button>
        </div>
      </div>

      {/* 主内容 */}
      <div className="flex-1 flex">
        {/* 工具面板 */}
        <div className="w-72 p-4 border-r overflow-auto" style={{ borderColor: 'var(--border-light)' }}>
          <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            可用工具
          </h3>
          <div className="space-y-3">
            {tools.map(tool => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </div>

        {/* 流程图画布 */}
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={{ tool: ToolNode }}
            fitView
            className="h-full"
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#222" gap={30} size={1} />
            <Controls />
            <Panel position="top-right" className="p-4 rounded-xl" style={{ backgroundColor: 'var(--surface-secondary)' }}>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                拖拽工具到画布创建节点
              </div>
            </Panel>
          </ReactFlow>
        </div>
      </div>
    </div>
  );
};

export const TracksPage: React.FC = () => {
  const [tools, setTools] = useState<Tool[]>(DEFAULT_TOOLS);
  const [tracks, setTracks] = useState<Track[]>(DEFAULT_TRACKS);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // 加载数据
  React.useEffect(() => {
    const loadData = async () => {
      try {
        const [toolsRes, tracksRes] = await Promise.all([
          fetch('/api/tools').catch(() => null),
          fetch('/api/tracks').catch(() => null)
        ]);

        if (toolsRes?.ok) {
          const toolsData = await toolsRes.json();
          setTools(toolsData.tools || DEFAULT_TOOLS);
        }

        if (tracksRes?.ok) {
          const tracksData = await tracksRes.json();
          setTracks(tracksData.tracks || DEFAULT_TRACKS);
        }

        // 打印调试信息
        console.log('Loaded tracks:', tracks);
        console.log('Loaded tools:', tools);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadData();
  }, []);

  if (editingTrack) {
    return (
      <TrackFlowEditor
        track={editingTrack}
        tools={tools}
        onClose={() => setEditingTrack(null)}
        onSave={(updatedTrack) => {
          console.log('Updated track:', updatedTrack);
          setTracks(tracks.map(t => t.id === updatedTrack.id ? updatedTrack : t));
          setEditingTrack(null);
        }}
      />
    );
  }

  return (
    <div className="h-full w-full p-8 overflow-auto">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              轨道配置
            </h1>
            <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
              管理工具和轨道，配置可视化流程
            </p>
          </div>
        </div>

        {/* 工具注册 */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              注册的工具 ({tools.length})
            </h2>
            <button className="px-4 py-2 rounded-lg font-bold text-white flex items-center gap-2" style={{ backgroundColor: 'var(--brand-purple)' }}>
              <Plus size={16} />
              添加工具
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map(tool => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>

        {/* 轨道注册 */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              业务轨道 ({tracks.length})
            </h2>
            <button className="px-4 py-2 rounded-lg font-bold text-white flex items-center gap-2" style={{ backgroundColor: 'var(--brand-purple)' }}>
              <Plus size={16} />
              添加轨道
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tracks.map(track => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setEditingTrack(track)}
                className="p-6 rounded-2xl border cursor-pointer transition-all hover:shadow-lg"
                style={{
                  backgroundColor: 'var(--surface-secondary)',
                  borderColor: 'var(--border-light)'
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--brand-purple)', color: 'white' }}>
                      <Database size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--text-primary)' }}>
                        {track.name}
                      </h3>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {track.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
                    支持的操作
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {track.ops.map(op => {
                      const hasFlow = track.flows?.[op] && track.flows[op].length > 0;
                      return (
                        <span
                          key={op}
                          className="text-[10px] font-mono px-2 py-1 rounded-md flex items-center gap-1"
                          style={{
                            backgroundColor: hasFlow ? 'var(--brand-purple)/10' : 'var(--surface-tertiary)',
                            color: hasFlow ? 'var(--brand-purple)' : 'var(--text-secondary)',
                            border: hasFlow ? '1px solid var(--brand-purple)/30' : '1px solid var(--border-light)'
                          }}
                        >
                          {op}
                          {hasFlow && <Check size={8} />}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-3 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-light)' }}>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
                      {track.tools.length} 个工具
                    </span>
                    <span className="text-[10px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
                      {Object.keys(track.flows || {}).length} 个已配置流程
                    </span>
                  </div>
                  <span className="text-[10px]" style={{ color: 'var(--brand-purple)' }}>
                    点击配置流程 →
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default TracksPage;
