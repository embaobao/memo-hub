import React, { useState, useEffect } from 'react';
import { Settings, Save, Cpu, Layers, Activity } from 'lucide-react';
import RegistryMatrix from '../../../MemoHub/RegistryMatrix';
import MCPSkillGovernance from '../../../MemoHub/MCPSkillGovernance';

const MemoHub = () => {
  const [providers, setProviders] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/config/providers')
      .then(res => res.json())
      .then(data => {
        setProviders(data || {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    const res = await fetch('/api/config/providers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providers })
    });
    if (res.ok) alert('MemoHub configuration saved successfully.');
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b pb-4 dark:border-white/10">
        <div>
          <h2 className="text-lg font-bold">MemoHub Integration</h2>
          <p className="text-sm text-zinc-500">Configure AI Providers and Memory Orchestration</p>
        </div>
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all font-bold text-sm shadow-lg shadow-emerald-600/20"
        >
          <Save size={16} /> Apply Settings
        </button>
      </div>

      <div className="space-y-6">
        <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-4">
           <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-widest">
              <Cpu size={14} />
              AI Providers
           </div>
           {loading ? <div className="text-sm italic opacity-50">Fetching kernel state...</div> : (
             <div className="space-y-4">
               {Object.keys(providers).length === 0 && <div className="text-sm text-zinc-600 italic">No providers defined in config.jsonc</div>}
               {Object.entries(providers).map(([id, config]: [string, any]) => (
                 <div key={id} className="grid grid-cols-[120px_1fr] gap-4 items-center">
                    <span className="text-xs font-mono font-bold text-zinc-400">{id}</span>
                    <div className="grid grid-cols-2 gap-2">
                       <input 
                         placeholder="Endpoint"
                         value={config.baseURL || ''} 
                         onChange={e => setProviders({...providers, [id]: {...config, baseURL: e.target.value}})}
                         className="bg-black/20 border border-white/5 rounded px-3 py-1.5 text-xs outline-none focus:border-blue-500/30"
                       />
                       <input 
                         type="password"
                         placeholder="API Key"
                         value={config.apiKey || ''} 
                         onChange={e => setProviders({...providers, [id]: {...config, apiKey: e.target.value}})}
                         className="bg-black/20 border border-white/5 rounded px-3 py-1.5 text-xs outline-none focus:border-blue-500/30"
                       />
                    </div>
                 </div>
               ))}
             </div>
           )}
        </div>

        <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-4">
           <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-widest">
              <Layers size={14} />
              Registry Governance
           </div>
           <RegistryMatrix />
        </div>

        <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-4">
           <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-widest">
              <ShieldCheck size={14} />
              MCP Skill Governance
           </div>
           <MCPSkillGovernance />
        </div>
      </div>
    </div>
  );
};

export default MemoHub;
