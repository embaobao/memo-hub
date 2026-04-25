import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, ArrowRightLeft, Check, X, GitMerge, Share2 } from 'lucide-react';

/**
 * 澄清中心 - 解决记忆冲突
 */
const ClarifyCenter = () => {
  const [conflicts, setConflicts] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/conflicts').then(r => r.json()).then(data => setConflicts(data.conflicts || []));
  }, []);

  if (conflicts.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center opacity-30">
        <ShieldAlert size={64} strokeWidth={1} />
        <p className="mt-4 font-bold uppercase tracking-widest text-sm">No unresolved conflicts</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-10">
        <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
           <ShieldAlert size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Clarify Center</h2>
          <p className="text-zinc-500 text-xs font-mono">Resolving semantic contradictions and duplicates</p>
        </div>
      </div>

      {conflicts.map(c => (
        <div key={c.id} className="glass rounded-[3rem] p-10 border-amber-500/20 overflow-hidden relative">
          <div className="absolute top-0 right-0 px-6 py-2 bg-amber-500/10 text-amber-500 text-[9px] font-black uppercase tracking-widest rounded-bl-3xl border-l border-b border-amber-500/20">
             Overlap: {(c.similarity * 100).toFixed(1)}%
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] gap-10 items-center">
            <div className="space-y-4">
              <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Memory A</span>
              <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 text-sm text-zinc-300 leading-relaxed font-mono italic">
                {c.a.text}
              </div>
            </div>

            <ArrowRightLeft className="text-zinc-700" size={32} />

            <div className="space-y-4">
              <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Memory B</span>
              <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 text-sm text-zinc-300 leading-relaxed font-mono italic">
                {c.b.text}
              </div>
            </div>
          </div>

          <div className="mt-10 flex gap-4 pt-8 border-t border-white/5">
             <button className="flex-1 py-4 glass rounded-2xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest hover:bg-white/5 transition-all">
                <X size={14} className="text-red-500" /> Discard B
             </button>
             <button className="flex-1 py-4 bg-blue-600 text-white rounded-2xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 active:scale-95 transition-all">
                <GitMerge size={14} /> Merge Semantic
             </button>
             <button className="flex-1 py-4 glass rounded-2xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest hover:bg-white/5 transition-all">
                <Check size={14} className="text-emerald-500" /> Keep Both
             </button>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * 简单的关系图组件 (可视化占位)
 */
const RelationGraph = ({ entity }: { entity: string }) => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/wiki/relations?entity=${entity}`).then(r => r.json()).then(setData);
  }, [entity]);

  if (!data) return null;

  return (
    <div className="p-8 rounded-[2.5rem] bg-white/[0.01] border border-white/5 relative overflow-hidden group h-64 flex items-center justify-center">
       <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--border)_1px,_transparent_1px)] [background-size:20px_24px] opacity-20" />
       
       <div className="relative z-10 flex flex-col items-center">
          <Share2 className="text-blue-500 mb-4 animate-pulse" size={40} strokeWidth={1} />
          <div className="flex gap-10 items-center justify-center w-full">
             {data.nodes.map((n:any) => (
                <div key={n.id} className="flex flex-col items-center gap-2">
                   <div className={`h-12 w-12 rounded-2xl flex items-center justify-center border ${
                      n.id === entity ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-white/5 border-white/10 text-zinc-500'
                   }`}>
                      <Box size={20} />
                   </div>
                   <span className="text-[10px] font-bold uppercase font-mono tracking-tighter">{n.label}</span>
                </div>
             ))}
          </div>
       </div>
    </div>
  );
};

export { ClarifyCenter, RelationGraph };
