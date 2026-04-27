import React, { useState, useEffect } from 'react';
import { Database, Package, ShieldCheck, Activity } from 'lucide-react';

const RegistryMatrix = () => {
  const [data, setData] = useState({ tracks: [], tools: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/inspect')
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-4 opacity-50 italic">Inspecting kernel registry...</div>;

  return (
    <div className="space-y-8 p-4">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-500 font-black text-[10px] uppercase tracking-widest">
           <Package size={14} className="text-purple-500" />
           Registered Tracks
        </div>
        <div className="grid grid-cols-2 gap-4">
           {data.tracks.map((track:any) => (
             <div key={track.id} className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                <div className="flex justify-between items-center mb-2">
                   <span className="text-sm font-bold">{track.name}</span>
                   <span className="text-[10px] font-mono text-zinc-500">{track.id}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                   {Object.keys(track.flows || {}).map(op => (
                      <span key={op} className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold border border-emerald-500/20">{op}</span>
                   ))}
                </div>
             </div>
           ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 text-zinc-500 font-black text-[10px] uppercase tracking-widest">
           <Database size={14} className="text-blue-500" />
           Atomic Tool Manifest
        </div>
        <div className="grid grid-cols-1 gap-2">
           {data.tools.map((tool:any) => (
             <div key={tool.id} className="px-4 py-3 rounded-lg border border-zinc-100 dark:border-zinc-900 flex justify-between items-center">
                <div className="flex items-center gap-3">
                   <ShieldCheck size={14} className="text-emerald-500" />
                   <span className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">{tool.id}</span>
                </div>
                <span className="text-[10px] text-zinc-500 italic truncate max-w-[300px]">{tool.description}</span>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};

export default RegistryMatrix;
