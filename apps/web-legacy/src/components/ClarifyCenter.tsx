import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitMerge, ArrowRightLeft, Check, X, Eye, EyeOff, ChevronRight, AlertTriangle, FileText, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface Conflict {
  id: string;
  type: 'duplicate' | 'contradiction' | 'outdated';
  severity: 'high' | 'medium' | 'low';
  timestamp: string;
  records: [
    {
      id: string;
      trackId: string;
      content: string;
      metadata: {
        source: string;
        confidence: number;
        createdAt: string;
      };
    },
    {
      id: string;
      trackId: string;
      content: string;
      metadata: {
        source: string;
        confidence: number;
        createdAt: string;
      };
    }
  ];
}

interface ClarifyCenterProps {
  onClose?: () => void;
}

export const ClarifyCenter: React.FC<ClarifyCenterProps> = ({ onClose }) => {
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [selectedConflict, setSelectedConflict] = useState<Conflict | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'duplicate' | 'contradiction' | 'outdated'>('all');

  useEffect(() => {
    loadConflicts();
  }, []);

  const loadConflicts = async () => {
    setIsLoading(true);
    try {
      // 模拟 API 调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      setConflicts([
        {
          id: 'conflict-1',
          type: 'duplicate',
          severity: 'medium',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          records: [
            {
              id: 'rec-1',
              trackId: 'track-insight',
              content: 'MemoHub 是一个基于流编排的个人记忆管理系统',
              metadata: {
                source: 'user-input',
                confidence: 0.95,
                createdAt: new Date(Date.now() - 172800000).toISOString()
              }
            },
            {
              id: 'rec-2',
              trackId: 'track-wiki',
              content: 'MemoHub 是一个基于流编排的个人记忆管理系统',
              metadata: {
                source: 'wiki-import',
                confidence: 0.88,
                createdAt: new Date(Date.now() - 86400000).toISOString()
              }
            }
          ]
        },
        {
          id: 'conflict-2',
          type: 'contradiction',
          severity: 'high',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          records: [
            {
              id: 'rec-3',
              trackId: 'track-insight',
              content: '系统使用 Ollama 作为嵌入模型',
              metadata: {
                source: 'config',
                confidence: 0.98,
                createdAt: new Date(Date.now() - 7200000).toISOString()
              }
            },
            {
              id: 'rec-4',
              trackId: 'track-source',
              content: '系统使用 OpenAI 作为嵌入模型',
              metadata: {
                source: 'code-analysis',
                confidence: 0.75,
                createdAt: new Date(Date.now() - 3600000).toISOString()
              }
            }
          ]
        }
      ]);
    } catch (error) {
      console.error('Failed to load conflicts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolve = async (conflictId: string, action: 'merge' | 'keep_first' | 'keep_second' | 'delete_both') => {
    try {
      // 调用 API 解决冲突
      await fetch('/api/clarify/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conflictId, action })
      });

      // 从列表中移除已解决的冲突
      setConflicts(prev => prev.filter(c => c.id !== conflictId));
      setSelectedConflict(null);
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'low': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      default: return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'duplicate': return <GitMerge size={18} />;
      case 'contradiction': return <AlertTriangle size={18} />;
      case 'outdated': return <Clock size={18} />;
      default: return <FileText size={18} />;
    }
  };

  const filteredConflicts = conflicts.filter(c => filter === 'all' || c.type === filter);

  return (
    <div className="h-full flex" style={{ backgroundColor: 'var(--surface-primary-alt)' }}>
      {/* 侧边栏：冲突列表 - LibreChat 风格 */}
      <aside className="w-96 border-r flex flex-col" style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--surface-secondary)' }}>
        <header className="h-16 border-b flex items-center px-4" style={{ borderColor: 'var(--border-light)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--surface-active)', color: 'var(--brand-purple)' }}>
              <GitMerge size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>冲突解决中心</h2>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {conflicts.length} 个冲突
              </p>
            </div>
          </div>
        </header>

        {/* 过滤器 - shadcn Tabs */}
        <div className="p-3 border-b" style={{ borderColor: 'var(--border-light)' }}>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
            <TabsList className="w-full">
              <TabsTrigger value="all" className="flex-1">全部 ({conflicts.length})</TabsTrigger>
              <TabsTrigger value="duplicate" className="flex-1">重复 ({conflicts.filter(c => c.type === 'duplicate').length})</TabsTrigger>
              <TabsTrigger value="contradiction" className="flex-1">矛盾 ({conflicts.filter(c => c.type === 'contradiction').length})</TabsTrigger>
              <TabsTrigger value="outdated" className="flex-1">过期 ({conflicts.filter(c => c.type === 'outdated').length})</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* 冲突列表 */}
        <div className="flex-1 overflow-auto p-4 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-blue-500 animate-pulse font-mono">Loading conflicts...</div>
            </div>
          ) : filteredConflicts.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-zinc-500 font-mono text-center">
                <Check size={48} className="mx-auto mb-4 text-green-500" />
                <p>No conflicts found</p>
              </div>
            </div>
          ) : (
            filteredConflicts.map((conflict, i) => (
              <motion.button
                key={conflict.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedConflict(conflict)}
                className={`w-full p-5 rounded-2xl border transition-all text-left ${
                  selectedConflict?.id === conflict.id
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-white/5 hover:border-white/10 bg-white/5'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getSeverityColor(conflict.severity)}`}>
                      {getTypeIcon(conflict.type)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white capitalize">{conflict.type}</h3>
                      <p className="text-[10px] text-zinc-500 font-mono">
                        {new Date(conflict.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    size={16}
                    className={`text-zinc-400 transition-all ${
                      selectedConflict?.id === conflict.id ? 'translate-x-1' : ''
                    }`}
                  />
                </div>
                <p className="text-xs text-zinc-400 line-clamp-2">
                  {conflict.records[0].content.slice(0, 100)}...
                </p>
              </motion.button>
            ))
          )}
        </div>
      </aside>

      {/* 主区域：A/B Diff 视图 */}
      <main className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {selectedConflict ? (
            <motion.div
              key="detail"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col"
            >
              {/* 操作栏 */}
              <header className="h-20 border-b border-white/10 flex items-center justify-between px-8 bg-black/40">
                <div className="flex items-center gap-4">
                  <span className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/20">
                    {selectedConflict.type}
                  </span>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${getSeverityColor(selectedConflict.severity)}`}>
                    {selectedConflict.severity} severity
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleResolve(selectedConflict.id, 'keep_first')}
                    className="px-4 py-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 text-sm font-bold hover:bg-blue-500/20 transition-all flex items-center gap-2"
                  >
                    <Eye size={16} />
                    Keep First
                  </button>
                  <button
                    onClick={() => handleResolve(selectedConflict.id, 'keep_second')}
                    className="px-4 py-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 text-sm font-bold hover:bg-purple-500/20 transition-all flex items-center gap-2"
                  >
                    <Eye size={16} />
                    Keep Second
                  </button>
                  <button
                    onClick={() => handleResolve(selectedConflict.id, 'merge')}
                    className="px-4 py-2 rounded-xl bg-green-500/10 text-green-400 border border-green-500/20 text-sm font-bold hover:bg-green-500/20 transition-all flex items-center gap-2"
                  >
                    <GitMerge size={16} />
                    Merge
                  </button>
                  <button
                    onClick={() => handleResolve(selectedConflict.id, 'delete_both')}
                    className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-sm font-bold hover:bg-red-500/20 transition-all flex items-center gap-2"
                  >
                    <X size={16} />
                    Delete Both
                  </button>
                </div>
              </header>

              {/* Diff 视图 */}
              <div className="flex-1 grid grid-cols-2 gap-0">
                {selectedConflict.records.map((record, i) => (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, x: i === 0 ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`border-r ${i === 0 ? 'border-white/10' : ''} p-8 overflow-auto`}
                  >
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
                          Record {i + 1}
                        </span>
                        <span className="text-[10px] px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {record.trackId}
                        </span>
                      </div>
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-500">Source</span>
                          <span className="text-white font-mono">{record.metadata.source}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-500">Confidence</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500"
                                style={{ width: `${record.metadata.confidence * 100}%` }}
                              />
                            </div>
                            <span className="text-white font-mono">
                              {Math.round(record.metadata.confidence * 100)}%
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-500">Created</span>
                          <span className="text-white font-mono text-[10px]">
                            {new Date(record.metadata.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="glass p-6 rounded-2xl border border-white/5">
                      <h3 className="text-sm font-bold text-white mb-3">Content</h3>
                      <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                        {record.content}
                      </p>
                    </div>

                    {/* Diff 高亮 */}
                    {i === 1 && (
                      <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle size={16} className="text-red-400" />
                          <span className="text-sm font-bold text-red-400">Differences Detected</span>
                        </div>
                        <p className="text-xs text-red-300">
                          This record contradicts with the previous one.
                        </p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex items-center justify-center"
            >
              <div className="text-center">
                <GitMerge size={64} className="mx-auto mb-4 text-zinc-600" />
                <h3 className="text-xl font-bold text-zinc-400 mb-2">No Conflict Selected</h3>
                <p className="text-sm text-zinc-500">
                  Select a conflict from the sidebar to review and resolve it
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default ClarifyCenter;