import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Terminal, Sparkles, Copy, Check, RefreshCw, Trash2, Save, Code, MessageSquare, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TextareaAutosize } from '@/components/ui/TextareaAutosize';
import { Card } from '@/components/ui/card';
import Message from '@/components/ui/Message';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    model?: string;
    latency?: number;
    tools?: string[];
  };
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export const AgentPlayground: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful AI assistant with access to MemoHub memory system.');
  const [isFocused, setIsFocused] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 初始化示例对话
    const exampleConversation: Conversation = {
      id: 'conv-1',
      title: 'Memory Query Example',
      messages: [
        {
          id: 'msg-1',
          role: 'system' as const,
          content: systemPrompt,
          timestamp: new Date().toISOString()
        },
        {
          id: 'msg-2',
          role: 'user' as const,
          content: 'What do you remember about MemoHub?',
          timestamp: new Date(Date.now() - 60000).toISOString()
        },
        {
          id: 'msg-3',
          role: 'assistant' as const,
          content: 'Based on my memory, MemoHub is a personal memory management system built on flow orchestration. It provides atomic tools for memory operations and supports multiple tracks including insight, source, wiki, and stream tracks.',
          timestamp: new Date(Date.now() - 30000).toISOString(),
          metadata: {
            model: 'ollama/llama3.2',
            latency: 1.2,
            tools: ['query_knowledge', 'RETRIEVE']
          }
        }
      ] as Message[],
      createdAt: new Date(Date.now() - 120000).toISOString(),
      updatedAt: new Date().toISOString()
    };
    setConversations([exampleConversation]);
    setActiveConversation(exampleConversation);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    const updatedConversation = {
      ...activeConversation!,
      messages: [...activeConversation!.messages, userMessage],
      updatedAt: new Date().toISOString()
    };

    setActiveConversation(updatedConversation);
    setConversations(prev => prev.map(c => c.id === updatedConversation.id ? updatedConversation : c));
    setInput('');
    setIsLoading(true);

    try {
      const startTime = Date.now();
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });

      // 检查响应状态
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      // 安全解析 JSON
      let data;
      const text = await response.text();
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { response: text || 'No response generated.' };
      }

      const latency = (Date.now() - startTime) / 1000;

      const assistantMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: data.response || 'No response generated.',
        timestamp: new Date().toISOString(),
        metadata: {
          latency,
          tools: data.tools_used || []
        }
      };

      const finalConversation = {
        ...updatedConversation,
        messages: [...updatedConversation.messages, assistantMessage],
        updatedAt: new Date().toISOString()
      };

      setActiveConversation(finalConversation);
      setConversations(prev => prev.map(c => c.id === finalConversation.id ? finalConversation : c));
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request.',
        timestamp: new Date().toISOString()
      };

      const errorConversation = {
        ...updatedConversation,
        messages: [...updatedConversation.messages, errorMessage],
        updatedAt: new Date().toISOString()
      };

      setActiveConversation(errorConversation);
      setConversations(prev => prev.map(c => c.id === errorConversation.id ? errorConversation : c));
    } finally {
      setIsLoading(false);
    }
  };

  const createNewConversation = () => {
    const newConversation: Conversation = {
      id: `conv-${Date.now()}`,
      title: 'New Conversation',
      messages: [
        {
          id: 'msg-0',
          role: 'system',
          content: systemPrompt,
          timestamp: new Date().toISOString()
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setConversations(prev => [newConversation, ...prev]);
    setActiveConversation(newConversation);
  };

  const clearConversation = () => {
    if (!activeConversation) return;

    const clearedConversation: Conversation = {
      ...activeConversation,
      messages: [
        {
          id: 'msg-0',
          role: 'system',
          content: systemPrompt,
          timestamp: new Date().toISOString()
        }
      ],
      updatedAt: new Date().toISOString()
    };

    setActiveConversation(clearedConversation);
    setConversations(prev => prev.map(c => c.id === clearedConversation.id ? clearedConversation : c));
  };

  const exportConversation = () => {
    if (!activeConversation) return;

    const exportData = {
      conversation: activeConversation,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-${activeConversation.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex" style={{ backgroundColor: 'var(--surface-primary-alt)' }}>
      {/* 侧边栏：对话列表 - LibreChat 风格 */}
      <aside className="w-80 border-r flex flex-col" style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--surface-secondary)' }}>
        <header className="h-16 border-b flex items-center justify-between px-4" style={{ borderColor: 'var(--border-light)' }}>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'var(--brand-purple)', color: 'white' }}>
              <Terminal size={16} />
            </div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Playground</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={createNewConversation}
            className="h-8 w-8"
            title="New conversation"
          >
            <MessageSquare size={16} />
          </Button>
        </header>

        <div className="flex-1 overflow-auto p-2 space-y-1">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setActiveConversation(conv)}
              className={cn(
                "w-full p-3 rounded-lg border transition-all text-left text-sm",
                activeConversation?.id === conv.id
                  ? 'border-primary bg-primary/10'
                  : 'border-transparent hover:bg-muted'
              )}
            >
              <h3 className="font-medium mb-1 truncate" style={{ color: 'var(--text-primary)' }}>{conv.title}</h3>
              <p className="text-[10px] font-mono" style={{ color: 'var(--text-secondary)' }}>
                {new Date(conv.updatedAt).toLocaleString()}
              </p>
            </button>
          ))}
        </div>

        {/* 系统提示词开关 */}
        <div className="p-3 border-t" style={{ borderColor: 'var(--border-light)' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSystemPrompt(!showSystemPrompt)}
            className="w-full"
          >
            <Code size={14} className="mr-2" />
            {showSystemPrompt ? '隐藏' : '显示'}系统提示
          </Button>
        </div>
      </aside>

      {/* 主区域：对话界面 */}
      <main className="flex-1 flex flex-col">
        {activeConversation && (
          <>
            {/* 工具栏 - LibreChat 风格 */}
            <header className="h-14 border-b flex items-center justify-between px-4" style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--surface-secondary)' }}>
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{activeConversation.title}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono" style={{ backgroundColor: 'var(--surface-tertiary)', color: 'var(--text-secondary)' }}>
                  {activeConversation.messages.length} 消息
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearConversation}
                  className="h-8 w-8"
                  title="清空对话"
                >
                  <Trash2 size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={exportConversation}
                  className="h-8 w-8"
                  title="导出对话"
                >
                  <Save size={16} />
                </Button>
              </div>
            </header>

            {/* 系统提示词编辑器 */}
            <AnimatePresence>
              {showSystemPrompt && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-b border-white/10 overflow-hidden"
                >
                  <div className="p-4">
                    <textarea
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      className="w-full h-32 bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-zinc-300 resize-none focus:outline-none focus:border-purple-500/50 font-mono"
                      placeholder="Enter system prompt..."
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 消息列表 - 使用新的 Message 组件 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeConversation.messages.map((message, i) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Message
                    content={message.content}
                    role={message.role}
                    timestamp={message.timestamp}
                    isStreaming={false}
                  />
                  {message.metadata && (
                    <div className="mt-2 pt-2 border-t flex flex-wrap gap-2" style={{ borderColor: 'var(--border-light)' }}>
                      {message.metadata.tools && message.metadata.tools.length > 0 && (
                        <div className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                          <Sparkles size={12} />
                          <span className="font-mono">{message.metadata.tools.join(', ')}</span>
                        </div>
                      )}
                      {message.metadata.latency && (
                        <div className="text-[10px] font-mono" style={{ color: 'var(--text-secondary)' }}>
                          {message.metadata.latency.toFixed(2)}s
                        </div>
                      )}
                      {message.metadata.model && (
                        <div className="text-[10px] font-mono" style={{ color: 'var(--text-secondary)' }}>
                          {message.metadata.model}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mr-12"
                >
                  <Message
                    content="Thinking..."
                    role="assistant"
                    isStreaming={true}
                  />
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* LibreChat 风格的输入区域 */}
            <div className="p-4 border-t" style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--surface-secondary)' }}>
              <div className="mx-auto" style={{ maxWidth: '768px' }}>
                <div className="relative flex items-end gap-3 p-3 rounded-2xl border transition-shadow duration-200"
                     style={{
                       backgroundColor: 'var(--surface-primary)',
                       borderColor: 'var(--border-light)',
                       boxShadow: isFocused ? '0 4px 12px rgba(0, 0, 0, 0.15)' : '0 2px 8px rgba(0, 0, 0, 0.08)'
                     }}>
                  <TextareaAutosize
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="输入您的消息... (Enter 发送，Shift+Enter 换行)"
                    disabled={isLoading}
                    className="flex-1 resize-none bg-transparent text-sm focus:outline-none"
                    style={{
                      color: 'var(--text-primary)',
                      minHeight: '24px',
                      maxHeight: '200px'
                    }}
                    rows={1}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={isLoading || !input.trim()}
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                  >
                    {isLoading ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                  </Button>
                </div>
                <div className="mt-2 text-[10px] text-center" style={{ color: 'var(--text-tertiary)' }}>
                  按 Enter 发送，Shift+Enter 换行
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default AgentPlayground;