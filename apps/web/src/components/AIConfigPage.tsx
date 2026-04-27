import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Database, Activity, Code, Search, RefreshCw, Layers, GitMerge, FileText, Network, ShieldAlert, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// 实际注册的工具信息
const REGISTERED_TOOLS = [
  { id: 'cas', name: 'CAS 存储', description: '内容寻址存储', icon: 'Database', status: 'active' },
  { id: 'vector', name: '向量操作', description: '向量数据库操作', icon: 'Activity', status: 'active' },
  { id: 'embedder', name: '文本嵌入', description: '文本向量化', icon: 'Code', status: 'active' },
  { id: 'retriever', name: '检索器', description: '向量相似度检索', icon: 'Search', status: 'active' },
  { id: 'reranker', name: '重排序', description: '结果重排序优化', icon: 'RefreshCw', status: 'active' },
  { id: 'aggregator', name: '聚合器', description: '多源数据聚合', icon: 'Layers', status: 'active' },
  { id: 'entity-linker', name: '实体链接', description: '实体关系提取', icon: 'GitMerge', status: 'active' },
  { id: 'code-analyzer', name: '代码分析', description: '代码结构分析', icon: 'FileText', status: 'active' },
  { id: 'graph-store', name: '图存储', description: '知识图谱存储', icon: 'Network', status: 'active' },
  { id: 'deduplicator', name: '去重器', description: '重复数据检测', icon: 'ShieldAlert', status: 'active' }
];

// 实际注册的轨道信息
const REGISTERED_TRACKS = [
  {
    id: 'track-insight',
    name: '知识轨道',
    icon: 'Database',
    description: '存储 LLM 提纯后的事实和结论',
    ops: ['ADD', 'RETRIEVE', 'UPDATE', 'DELETE', 'MERGE', 'LIST', 'EXPORT', 'DISTILL', 'ANCHOR', 'DIFF', 'SYNC'],
    tools: ['cas', 'vector', 'embedder', 'retriever', 'reranker']
  },
  {
    id: 'track-source',
    name: '源代码轨道',
    icon: 'Code',
    description: '代码库分析和理解',
    ops: ['ADD', 'RETRIEVE', 'UPDATE', 'DELETE'],
    tools: ['cas', 'code-analyzer', 'embedder']
  },
  {
    id: 'track-stream',
    name: '流轨道',
    icon: 'Activity',
    description: '实时数据流处理',
    ops: ['ADD', 'RETRIEVE'],
    tools: ['cas', 'aggregator', 'vector']
  },
  {
    id: 'track-wiki',
    name: '知识库轨道',
    icon: 'FileText',
    description: '结构化知识管理',
    ops: ['ADD', 'RETRIEVE', 'UPDATE', 'DELETE', 'SEARCH'],
    tools: ['cas', 'graph-store', 'entity-linker', 'deduplicator', 'retriever']
  }
];

const iconMap: Record<string, React.ElementType> = {
  Database,
  Activity,
  Code,
  Search,
  RefreshCw,
  Layers,
  GitMerge,
  FileText,
  Network,
  ShieldAlert
};

interface ToolCardProps {
  tool: typeof REGISTERED_TOOLS[0];
}

const ToolCard: React.FC<ToolCardProps> = ({ tool }) => {
  const IconComponent = iconMap[tool.icon];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 rounded-2xl border transition-all hover:scale-105"
      style={{
        backgroundColor: 'var(--surface-secondary)',
        borderColor: 'var(--border-light)'
      }}
    >
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--brand-purple)', color: 'white' }}>
          {IconComponent && <IconComponent size={20} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
              {tool.name}
            </h3>
            {tool.status === 'active' && (
              <Check size={14} className="text-green-500" />
            )}
          </div>
          <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
            {tool.description}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{
              backgroundColor: 'var(--surface-tertiary)',
              color: 'var(--text-secondary)'
            }}>
              {tool.id}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

interface TrackCardProps {
  track: typeof REGISTERED_TRACKS[0];
  onClick?: () => void;
}

const TrackCard: React.FC<TrackCardProps> = ({ track, onClick }) => {
  const IconComponent = iconMap[track.icon];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="p-6 rounded-2xl border transition-all cursor-pointer hover:scale-105 hover:shadow-lg"
      style={{
        backgroundColor: 'var(--surface-secondary)',
        borderColor: 'var(--border-light)'
      }}
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--brand-purple)', color: 'white' }}>
          {IconComponent && <IconComponent size={24} />}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--text-primary)' }}>
            {track.name}
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {track.description}
          </p>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
          支持的操作
        </h4>
        <div className="flex flex-wrap gap-2">
          {track.ops.map(op => (
            <span
              key={op}
              className="text-[10px] font-mono px-2 py-1 rounded-md"
              style={{
                backgroundColor: 'var(--surface-tertiary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-light)'
              }}
            >
              {op}
            </span>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
          使用的工具 ({track.tools.length})
        </h4>
        <div className="flex flex-wrap gap-2">
          {track.tools.map(toolId => {
            const tool = REGISTERED_TOOLS.find(t => t.id === toolId);
            return tool ? (
              <span
                key={toolId}
                className="text-[10px] px-2 py-1 rounded-full flex items-center gap-1"
                style={{
                  backgroundColor: 'var(--brand-purple)/10',
                  color: 'var(--brand-purple)',
                  border: '1px solid var(--brand-purple)/20'
                }}
              >
                {tool.name}
              </span>
            ) : null;
          })}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-light)' }}>
        <span className="text-[10px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
          {track.id}
        </span>
        <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
          点击查看流程图 →
        </span>
      </div>
    </motion.div>
  );
};

interface TrackFlowModalProps {
  track: typeof REGISTERED_TRACKS[0];
  onClose: () => void;
}

const TrackFlowModal: React.FC<TrackFlowModalProps> = ({ track, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="max-w-4xl w-full max-h-[80vh] overflow-auto rounded-2xl p-6"
        style={{ backgroundColor: 'var(--surface-secondary)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {track.name} 流程图
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {track.description}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-hover transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {track.ops.map((op, index) => (
            <div key={op} className="relative">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{
                      backgroundColor: 'var(--brand-purple)',
                      color: 'white'
                    }}>
                  {index + 1}
                </div>
                <div className="flex-1 p-4 rounded-xl" style={{
                  backgroundColor: 'var(--surface-tertiary)',
                  border: '1px solid var(--border-light)'
                }}>
                  <div className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                    {op}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {op === 'ADD' && '添加新记忆到轨道'}
                    {op === 'RETRIEVE' && '从轨道检索相关记忆'}
                    {op === 'UPDATE' && '更新现有记忆'}
                    {op === 'DELETE' && '删除指定记忆'}
                    {op === 'MERGE' && '合并多个记忆'}
                    {op === 'LIST' && '列出所有记忆'}
                    {op === 'EXPORT' && '导出记忆数据'}
                    {op === 'DISTILL' && '提纯知识'}
                    {op === 'ANCHOR' && '锚定关键信息'}
                    {op === 'DIFF' && '比较记忆差异'}
                    {op === 'SYNC' && '同步记忆状态'}
                    {op === 'SEARCH' && '搜索知识库'}
                  </div>
                </div>
              </div>
              {index < track.ops.length - 1 && (
                <div className="ml-6 w-0.5 h-8" style={{ backgroundColor: 'var(--border-medium)' }} />
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--border-light)' }}>
          <h4 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
            使用的工具节点
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {track.tools.map(toolId => {
              const tool = REGISTERED_TOOLS.find(t => t.id === toolId);
              const IconComponent = tool ? iconMap[tool.icon] : null;
              return tool ? (
                <div
                  key={toolId}
                  className="p-3 rounded-lg flex items-center gap-2"
                  style={{
                    backgroundColor: 'var(--surface-tertiary)',
                    border: '1px solid var(--border-light)'
                  }}
                >
                  {IconComponent && (
                    <div className="p-1.5 rounded" style={{ backgroundColor: 'var(--brand-purple)/20' }}>
                      <IconComponent size={14} style={{ color: 'var(--brand-purple)' }} />
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                      {tool.name}
                    </div>
                    <div className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                      {tool.id}
                    </div>
                  </div>
                </div>
              ) : null;
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export const AIConfigPage: React.FC = () => {
  const [selectedTrack, setSelectedTrack] = React.useState<typeof REGISTERED_TRACKS[0] | null>(null);

  return (
    <div className="h-full w-full overflow-auto p-8">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            AI 配置
          </h1>
          <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
            查看和管理 MemoHub 的工具和轨道配置
          </p>
        </div>

        {/* 工具列表 */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              注册的工具
            </h2>
            <span className="text-sm px-3 py-1 rounded-full" style={{
              backgroundColor: 'var(--surface-tertiary)',
              color: 'var(--text-secondary)'
            }}>
              {REGISTERED_TOOLS.length} 个工具
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {REGISTERED_TOOLS.map(tool => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>

        {/* 轨道列表 */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              业务轨道
            </h2>
            <span className="text-sm px-3 py-1 rounded-full" style={{
              backgroundColor: 'var(--surface-tertiary)',
              color: 'var(--text-secondary)'
            }}>
              {REGISTERED_TRACKS.length} 个轨道
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {REGISTERED_TRACKS.map(track => (
              <TrackCard
                key={track.id}
                track={track}
                onClick={() => setSelectedTrack(track)}
              />
            ))}
          </div>
        </section>

        {/* 轨道流程图模态框 */}
        {selectedTrack && (
          <TrackFlowModal
            track={selectedTrack}
            onClose={() => setSelectedTrack(null)}
          />
        )}
      </div>
    </div>
  );
};

export default AIConfigPage;
