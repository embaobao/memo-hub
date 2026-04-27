import React, { useState, useEffect } from 'react';
import { useRecoilState } from 'recoil';
import { Box, Layers, Cpu, Settings, Save } from 'lucide-react';

const MemoHubSettings = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/config/providers')
      .then(res => res.json())
      .then(data => {
        setProviders(data);
        setLoading(false);
      });
  }, []);

  const handleSave = () => {
    fetch('/api/config/providers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providers })
    }).then(() => alert('MemoHub AI Providers updated.'));
  };

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-500" />
          MemoHub Core Configuration
        </h3>
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Save size={16} /> Save Changes
        </button>
      </div>

      <div className="space-y-4 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 bg-zinc-50 dark:bg-zinc-900/50">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">AI Providers</span>
        {loading ? <div className="animate-pulse">Loading config...</div> : (
          Object.keys(providers).map(key => (
            <div key={key} className="flex flex-col gap-2 p-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
               <span className="text-sm font-mono font-bold text-blue-400">{key}</span>
               <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-zinc-500">API Key</label>
                    <input 
                      type="password"
                      value={providers[key].apiKey || ''} 
                      className="bg-transparent border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-xs"
                      onChange={(e) => setProviders({...providers, [key]: {...providers[key], apiKey: e.target.value}})}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-zinc-500">Base URL</label>
                    <input 
                      type="text"
                      value={providers[key].baseURL || ''} 
                      className="bg-transparent border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-xs"
                      onChange={(e) => setProviders({...providers, [key]: {...providers[key], baseURL: e.target.value}})}
                    />
                  </div>
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MemoHubSettings;
