import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import 'highlight.js/styles/github-dark.css';

interface MessageProps {
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp?: string;
  isStreaming?: boolean;
}

export const Message: React.FC<MessageProps> = ({
  content,
  role,
  timestamp,
  isStreaming = false
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRoleStyles = () => {
    switch (role) {
      case 'user':
        return 'bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20 ml-12';
      case 'assistant':
        return 'bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20 mr-12';
      case 'system':
        return 'bg-gradient-to-br from-zinc-500/10 to-transparent border-zinc-500/20 mx-12';
      default:
        return 'bg-surface-secondary border-border-light';
    }
  };

  const getRoleIcon = () => {
    switch (role) {
      case 'user':
        return <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">U</div>;
      case 'assistant':
        return <div className="h-6 w-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs">AI</div>;
      case 'system':
        return <div className="h-6 w-6 rounded-full bg-zinc-500 flex items-center justify-center text-white text-xs">S</div>;
      default:
        return null;
    }
  };

  return (
    <div className={cn(
      "relative p-4 rounded-2xl border transition-all duration-200 group",
      getRoleStyles()
    )}>
      {/* 消息头部 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {getRoleIcon()}
          <span className="text-xs font-bold uppercase" style={{ color: 'var(--text-secondary)' }}>
            {role}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {timestamp && (
            <span className="text-[10px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
              {new Date(timestamp).toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={handleCopy}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-surface-hover"
            title="复制内容"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      {/* 消息内容 - Markdown 支持 */}
      <div className="prose prose-sm dark:prose-invert max-w-none" style={{ color: 'var(--text-primary)' }}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={{
            // 代码块样式
            pre: (props: any) => (
              <div className="relative group my-4">
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      const code = props.children?.props?.children || '';
                      navigator.clipboard.writeText(code);
                    }}
                    className="p-1 rounded bg-surface-tertiary hover:bg-surface-hover"
                    title="复制代码"
                  >
                    <Copy size={12} />
                  </button>
                </div>
                <pre
                  {...props}
                  className="bg-surface-tertiary p-4 rounded-lg overflow-x-auto text-sm"
                  style={{ border: '1px solid var(--border-light)' }}
                />
              </div>
            ),
            // 行内代码样式
            code: (props: any) =>
              props.className?.includes('language-') || props.inline === false ? (
                <code {...props} />
              ) : (
                <code
                  {...props}
                  className="bg-surface-tertiary px-1.5 py-0.5 rounded text-sm"
                  style={{ border: '1px solid var(--border-light)' }}
                />
              ),
            // 链接样式
            a: ({ node, ...props }) => (
              <a
                {...props}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              />
            ),
            // 列表样式
            ul: ({ node, ...props }) => (
              <ul {...props} className="list-disc list-inside my-2 space-y-1" />
            ),
            ol: ({ node, ...props }) => (
              <ol {...props} className="list-decimal list-inside my-2 space-y-1" />
            ),
            // 引用样式
            blockquote: ({ node, ...props }) => (
              <blockquote
                {...props}
                className="border-l-4 border-purple-500 pl-4 italic my-2"
                style={{ color: 'var(--text-secondary)' }}
              />
            ),
          }}
        >
          {content}
        </ReactMarkdown>
        {isStreaming && (
          <span className="inline-block ml-1 animate-pulse">▊</span>
        )}
      </div>
    </div>
  );
};

export default Message;