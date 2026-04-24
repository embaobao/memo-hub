import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Terminal, Send, Cpu, Globe } from 'lucide-react';

const TracePanel = () => {
  const [logs, setLogs] = useState([
    { id: '1', type: 'INFO', msg: 'Kernel starting...', time: '10:00:01' },
    { id: '2', type: 'TRACE', msg: 'Flow track-insight:ADD initialized', time: '10:00:02' },
    { id: '3', type: 'DEBUG', msg: 'Resolved payload.text: "Hello World"', time: '10:00:03' },
  ]);

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
         {logs.map(log => (
            <div key={log.id} className="flex gap-4 group">
               <span className="text-zinc-600 shrink-0">{log.time}</span>
               <span className={log.type === 'ERROR' ? 'text-red-500' : 'text-accent-source opacity-80'}>[{log.type}]</span>
               <span className="text-zinc-300 group-hover:text-white transition-colors">{log.msg}</span>
            </div>
         ))}
      </div>
    </div>
  );
};

const AgentSandbox = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hello! I am your MemoHub Assistant. How can I help you manage your memory today?' }
  ]);

  return (
    <div className="h-full flex flex-col max-w-3xl mx-auto">
       <div className="flex-1 p-4 space-y-6 overflow-auto">
          {messages.map((m, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={i} 
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
               <div className={`max-w-[80%] p-4 rounded-3xl ${
                  m.role === 'user' 
                  ? 'bg-accent-insight text-white shadow-xl shadow-accent-insight/20' 
                  : 'glass text-zinc-200 border-border/50'
               }`}>
                  <p className="text-sm leading-relaxed">{m.text}</p>
               </div>
            </motion.div>
          ))}
       </div>
       <div className="p-6 border-t border-border bg-background/50 backdrop-blur-xl">
          <div className="glass flex items-center gap-3 p-3 rounded-2xl border-border/50 group focus-within:border-accent-insight/50 transition-all">
             <input 
                placeholder="Ask Agent to search or store..." 
                className="flex-1 bg-transparent border-none outline-none text-sm px-2"
             />
             <button className="h-8 w-8 rounded-xl bg-accent-insight flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all">
                <Send size={14} />
             </button>
          </div>
          <div className="mt-3 flex items-center gap-4 px-2">
             <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                <Cpu size={10} />
                <span>Ollama / Qwen2.5</span>
             </div>
             <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                <Globe size={10} />
                <span>MCP Context: Enabled</span>
             </div>
          </div>
       </div>
    </div>
  );
};

export { TracePanel, AgentSandbox };
