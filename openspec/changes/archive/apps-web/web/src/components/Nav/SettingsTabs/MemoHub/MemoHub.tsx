import React, { useState, useEffect } from 'react';
import { Settings, Save, Cpu, Layers, Activity, ShieldCheck } from 'lucide-react';
import { Button, Input, Label, useToastContext } from '@librechat/client';
import RegistryMatrix from '../../../MemoHub/RegistryMatrix';
import MCPSkillGovernance from '../../../MemoHub/MCPSkillGovernance';
import { useLocalize } from '~/hooks';

const MemoHub = () => {
  const localize = useLocalize();
  const { showToast } = useToastContext();
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
    try {
      const res = await fetch('/api/config/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providers })
      });
      if (res.ok) {
        showToast({ message: 'MemoHub configuration saved successfully.', status: 'success' });
      } else {
        throw new Error('Failed to save');
      }
    } catch (e) {
      showToast({ message: 'Error saving configuration.', status: 'error' });
    }
  };

  return (
    <div className="flex flex-col gap-3 p-1 text-sm text-text-primary">
      <div className="flex items-center justify-between border-b pb-3 border-border-light dark:border-border-heavy">
        <div>
          <h2 className="text-lg font-bold text-text-primary">MemoHub Integration</h2>
          <p className="text-sm text-text-secondary">Configure AI Providers and Memory Orchestration</p>
        </div>
        <Button 
          onClick={handleSave}
          variant="primary"
          className="flex items-center gap-2"
        >
          <Save size={16} /> Apply Settings
        </Button>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border border-border-light dark:border-border-heavy p-4 bg-surface-secondary/30">
           <div className="flex items-center gap-2 text-text-primary font-bold text-xs uppercase tracking-widest mb-4">
              <Cpu size={14} className="text-blue-500" />
              AI Providers
           </div>
           {loading ? <div className="text-sm italic opacity-50">Fetching kernel state...</div> : (
             <div className="space-y-4">
               {Object.keys(providers).length === 0 && <div className="text-sm text-text-secondary italic">No providers defined in config.jsonc</div>}
               {Object.entries(providers).map(([id, config]: [string, any]) => (
                 <div key={id} className="flex flex-col gap-3 pb-4 border-b border-border-light last:border-0 last:pb-0">
                    <Label className="text-xs font-mono font-bold text-text-primary">{id}</Label>
                    <div className="grid grid-cols-2 gap-3">
                       <div className="space-y-1">
                         <Label className="text-[10px] text-text-secondary uppercase">Base URL</Label>
                         <Input 
                           placeholder="https://api.openai.com/v1"
                           value={config.baseURL || ''} 
                           onChange={e => setProviders({...providers, [id]: {...config, baseURL: e.target.value}})}
                           className="h-8 text-xs"
                         />
                       </div>
                       <div className="space-y-1">
                         <Label className="text-[10px] text-text-secondary uppercase">API Key</Label>
                         <Input 
                           type="password"
                           placeholder="sk-..."
                           value={config.apiKey || ''} 
                           onChange={e => setProviders({...providers, [id]: {...config, apiKey: e.target.value}})}
                           className="h-8 text-xs"
                         />
                       </div>
                    </div>
                 </div>
               ))}
             </div>
           )}
        </div>

        <div className="rounded-lg border border-border-light dark:border-border-heavy p-4 bg-surface-secondary/30">
           <div className="flex items-center gap-2 text-text-primary font-bold text-xs uppercase tracking-widest mb-4">
              <Layers size={14} className="text-purple-500" />
              Registry Governance
           </div>
           <RegistryMatrix />
        </div>

        <div className="rounded-lg border border-border-light dark:border-border-heavy p-4 bg-surface-secondary/30">
           <div className="flex items-center gap-2 text-text-primary font-bold text-xs uppercase tracking-widest mb-4">
              <ShieldCheck size={14} className="text-emerald-500" />
              MCP Skill Governance
           </div>
           <MCPSkillGovernance />
        </div>
      </div>
    </div>
  );
};

export default MemoHub;
