import React, { useState, useEffect } from 'react';
import { Database, Package, ShieldCheck } from 'lucide-react';
import { Label } from '@librechat/client';

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

  if (loading) return <div className="p-2 opacity-50 italic text-xs">Inspecting kernel registry...</div>;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-[10px] text-text-secondary font-black uppercase tracking-widest flex items-center gap-2">
           <Package size={12} className="text-purple-500" />
           Registered Tracks
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
           {data.tracks.map((track:any) => (
             <div key={track.id} className="p-3 rounded-lg border border-border-light dark:border-border-heavy bg-surface-primary shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center mb-2">
                   <span className="text-xs font-bold text-text-primary">{track.name}</span>
                   <span className="text-[9px] font-mono text-text-secondary">{track.id}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                   {Object.keys(track.flows || {}).map(op => (
                      <span key={op} className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold border border-emerald-500/20">{op}</span>
                   ))}
                </div>
             </div>
           ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-[10px] text-text-secondary font-black uppercase tracking-widest flex items-center gap-2">
           <Database size={12} className="text-blue-500" />
           Atomic Tool Manifest
        </Label>
        <div className="rounded-lg border border-border-light dark:border-border-heavy bg-surface-primary divide-y divide-border-light dark:divide-border-heavy overflow-hidden">
           {data.tools.map((tool:any) => (
             <div key={tool.id} className="px-4 py-2.5 flex justify-between items-center hover:bg-surface-secondary/50 transition-colors">
                <div className="flex items-center gap-2">
                   <ShieldCheck size={12} className="text-emerald-500" />
                   <span className="text-[11px] font-mono font-bold text-text-primary">{tool.id}</span>
                </div>
                <span className="text-[10px] text-text-secondary italic truncate max-w-[240px]">{tool.description}</span>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};

export default RegistryMatrix;
