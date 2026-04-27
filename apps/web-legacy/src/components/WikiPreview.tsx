import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, Link, Network, X, ChevronRight, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface WikiPreviewProps {
  assetId?: string;
  content?: string;
  onClose?: () => void;
}

interface Entity {
  name: string;
  type: string;
  confidence?: number;
}

interface WikiContent {
  id: string;
  title: string;
  content: string;
  entities: Entity[];
  relatedAssets: Array<{ id: string; title: string; similarity: number }>;
  lastModified: string;
}

export const WikiPreview: React.FC<WikiPreviewProps> = ({ assetId, content, onClose }) => {
  const [wikiData, setWikiData] = useState<WikiContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'entities' | 'relations'>('content');

  useEffect(() => {
    if (assetId || content) {
      loadWikiContent();
    }
  }, [assetId, content]);

  const loadWikiContent = async () => {
    setIsLoading(true);
    try {
      // 如果提供了直接内容，使用它；否则从 API 加载
      if (content) {
        setWikiData({
          id: 'local',
          title: 'Preview',
          content,
          entities: extractEntities(content),
          relatedAssets: [],
          lastModified: new Date().toISOString()
        });
      } else if (assetId) {
        const res = await fetch(`/api/assets/${assetId}`);
        const data = await res.json();
        setWikiData(data);
      }
    } catch (error) {
      console.error('Failed to load wiki content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const extractEntities = (text: string): Entity[] => {
    // 简单的实体提取逻辑（实际应用中应该使用 NLP 或后端 API）
    const entityPatterns = [
      { regex: /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g, type: 'PERSON' },
      { regex: /\b([A-Z]{2,})\b/g, type: 'ORGANIZATION' },
      { regex: /#(\w+)/g, type: 'TOPIC' },
    ];

    const entities: Entity[] = [];
    entityPatterns.forEach(({ regex, type }) => {
      const matches = text.matchAll(regex);
      for (const match of matches) {
        if (!entities.find(e => e.name === match[1])) {
          entities.push({ name: match[1], type, confidence: 0.8 });
        }
      }
    });

    return entities.slice(0, 20); // 限制数量
  };

  const renderMarkdown = (markdown: string) => {
    // 简单的 Markdown 渲染（实际应用中应该使用 react-markdown 等库）
    const lines = markdown.split('\n');
    return lines.map((line, i) => {
      if (line.startsWith('# ')) {
        return <h1 key={i} className="text-3xl font-bold mb-4 text-white">{line.slice(2)}</h1>;
      } else if (line.startsWith('## ')) {
        return <h2 key={i} className="text-2xl font-bold mb-3 text-white mt-6">{line.slice(3)}</h2>;
      } else if (line.startsWith('### ')) {
        return <h3 key={i} className="text-xl font-bold mb-2 text-white mt-4">{line.slice(4)}</h3>;
      } else if (line.startsWith('- ')) {
        return <li key={i} className="ml-6 mb-2 text-zinc-300">{line.slice(2)}</li>;
      } else if (line.match(/^\d+\. /)) {
        return <li key={i} className="ml-6 mb-2 text-zinc-300 list-decimal">{line.slice(line.indexOf(' ') + 1)}</li>;
      } else if (line.trim() === '') {
        return <br key={i} />;
      } else {
        return <p key={i} className="mb-3 text-zinc-300 leading-relaxed">{line}</p>;
      }
    });
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-blue-500 animate-pulse font-mono">Loading Wiki...</div>
      </div>
    );
  }

  if (!wikiData) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-zinc-500 font-mono">No content to preview</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-black/50 backdrop-blur-3xl">
      {/* Header */}
      <header className="h-20 border-b border-white/10 flex items-center justify-between px-8 bg-black/40">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
            <Book size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{wikiData.title}</h2>
            <p className="text-xs text-zinc-500 font-mono">
              {new Date(wikiData.lastModified).toLocaleString()}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
          <X size={20} className="text-zinc-400" />
        </button>
      </header>

      {/* Tabs */}
      <div className="h-16 border-b border-white/10 flex items-center px-8 gap-2 bg-black/40">
        {[
          { id: 'content', icon: <FileText size={18} />, label: 'Content' },
          { id: 'entities', icon: <Link size={18} />, label: 'Entities' },
          { id: 'relations', icon: <Network size={18} />, label: 'Relations' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-3 px-6 py-3 rounded-xl transition-all ${
              activeTab === tab.id
                ? 'bg-blue-500/10 text-blue-400'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            {tab.icon}
            <span className="text-sm font-semibold">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'content' && (
              <div className="max-w-4xl mx-auto prose prose-invert prose-lg">
                {renderMarkdown(wikiData.content)}
              </div>
            )}

            {activeTab === 'entities' && (
              <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {wikiData.entities.map((entity, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="glass p-5 rounded-2xl border border-white/5 hover:border-blue-500/20 transition-all"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold text-white">{entity.name}</span>
                        <span className="text-[10px] px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {entity.type}
                        </span>
                      </div>
                      {entity.confidence && (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 transition-all"
                              style={{ width: `${entity.confidence * 100}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {Math.round(entity.confidence * 100)}%
                          </span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
                {wikiData.entities.length === 0 && (
                  <div className="text-center text-zinc-500 font-mono py-12">
                    No entities found
                  </div>
                )}
              </div>
            )}

            {activeTab === 'relations' && (
              <div className="max-w-6xl mx-auto">
                {wikiData.relatedAssets.length > 0 ? (
                  <div className="space-y-3">
                    {wikiData.relatedAssets.map((asset, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="glass p-6 rounded-2xl border border-white/5 hover:border-blue-500/20 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition-colors">
                              <Book size={20} />
                            </div>
                            <div>
                              <h3 className="text-base font-bold text-white mb-1">{asset.title}</h3>
                              <p className="text-xs text-zinc-500 font-mono">{asset.id}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Similarity</p>
                              <p className="text-lg font-bold text-blue-400">
                                {Math.round(asset.similarity * 100)}%
                              </p>
                            </div>
                            <ChevronRight size={20} className="text-zinc-400 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-zinc-500 font-mono py-12">
                    No related assets found
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default WikiPreview;