import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Terminal, Send, Cpu, Globe } from 'lucide-react';

const TracePanel = ({ logs = [] }: { logs?: any[] }) => {
  return (
    <div className="h-full flex flex-col glass rounded-3xl overflow-hidden border-border/50">
      <div className="p-5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
           <Terminal size={16} className="text-accent-insight" />
           <span className="text-sm font-bold tracking-tight">Real-time Observation</span>
        </div>
        <span className="text-[10px] font-mono text-zinc-500">NDJSON_STREAM_ACTIVE</span>
      </div>
      <div className="flex-1 p-6 overflow-auto font-mono text-xs space-y-3">
         {logs.length === 0 && <div className="text-zinc-700 italic">Waiting for kernel events...</div>}
         {logs.map((log, i) => (
            <div key={i} className="flex gap-4 group">
               <span className="text-zinc-600 shrink-0">{log.time}</span>
               <span className={log.success === false ? 'text-red-500' : 'text-accent-source opacity-80'}>
                 [{log.op}]
               </span>
               <span className="text-zinc-300 group-hover:text-white transition-colors">
                 {log.trackId} - Stage: {log.stage} {log.error ? `- Error: ${log.error}` : ''}
               </span>
            </div>
         ))}
      </div>
    </div>
  );
};

const AgentSandbox = () => {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hello! I am your MemoHub Assistant. How can I help you manage your memory today?' }
  ]);

  const onSend = async () => {
    if (!input.trim() || isTyping) return;
    
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', text: data.response, sources: data.sources }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Sorry, I encountered an error connecting to the kernel.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto">
       <div className="flex-1 p-4 space-y-8 overflow-auto pr-4">
          {messages.map((m, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              key={i} 
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
               <div className="max-w-[85%] flex flex-col gap-2">
                  <div className={`p-5 rounded-[2rem] ${
                      m.role === 'user' 
                      ? 'bg-blue-600 text-white shadow-2xl shadow-blue-600/20' 
                      : 'glass text-zinc-200 border-white/5'
                  }`}>
                      <p className="text-sm leading-relaxed">{m.text}</p>
                  </div>
                  {m.sources && m.sources.length > 0 && (
                    <div className="px-4 flex flex-wrap gap-2">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Citations:</span>
                      {m.sources.map((s:any, si:number) => (
                        <span key={si} className="text-[9px] px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                          {s.id.slice(0, 8)}
                        </span>
                      ))}
                    </div>
                  )}
               </div>
            </motion.div>
          ))}
          {isTyping && (
             <div className="flex justify-start px-4">
                <div className="h-2 w-12 bg-white/5 rounded-full animate-pulse" />
             </div>
          )}
       </div>
       <div className="p-8 border-t border-white/5 bg-black/40 backdrop-blur-3xl rounded-t-[3rem]">
          <div className="glass flex items-center gap-4 p-4 rounded-3xl border-white/10 group focus-within:border-blue-500/40 transition-all shadow-2xl">
             <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSend()}
                placeholder="Ask Agent to search or store memories..." 
                className="flex-1 bg-transparent border-none outline-none text-sm px-2 placeholder:text-zinc-600"
             />
             <button 
                onClick={onSend}
                className="h-10 w-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all shadow-lg shadow-blue-600/30"
             >
                <Send size={18} />
             </button>
          </div>
          <div className="mt-4 flex items-center gap-6 px-4">
             <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-bold tracking-widest">
                <Cpu size={12} className="text-blue-500" />
                <span>OLLAMA / QWEN 2.5</span>
             </div>
             <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-bold tracking-widest">
                <ShieldCheck size={12} className="text-emerald-500" />
                <span>CONTEXT SECURE</span>
             </div>
          </div>
       </div>
    </div>
  );
};

export { TracePanel, AgentSandbox };
