import React, { useState, useEffect } from 'react';
import { ShieldCheck, Box } from 'lucide-react';
import { Label, useToastContext } from '@librechat/client';

/**
 * MCP 技能治理 - 完全对齐 LibreChat 列表样式
 */
const MCPSkillGovernance = () => {
  const [skills, setSkills] = useState([]);
  const { showToast } = useToastContext();

  useEffect(() => {
    fetch('/api/mcp/skills').then(r => r.json()).then(d => setSkills(d.skills || []));
  }, []);

  const toggleTool = (skillId: string, toolId: string, currentState: boolean) => {
     fetch('/api/mcp/tool/toggle', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ skillId, toolId, enabled: !currentState })
     }).then(() => {
        setSkills(skills.map(s => s.id === skillId 
           ? { ...s, tools: s.tools.map(t => t.id === toolId ? { ...t, enabled: !currentState } : t) }
           : s
        ));
        showToast({ message: `Tool ${toolId} ${!currentState ? 'enabled' : 'disabled'}.`, status: 'success' });
     });
  };

  return (
    <div className="space-y-4">
       {skills.map(skill => (
         <div key={skill.id} className="p-4 rounded-lg border border-border-light dark:border-border-heavy bg-surface-primary shadow-sm">
            <div className="flex items-center gap-2 mb-4 border-b border-border-light pb-2">
               <ShieldCheck size={16} className="text-emerald-500" />
               <span className="font-bold text-xs text-text-primary uppercase tracking-wide">{skill.name}</span>
               <span className="text-[9px] px-1.5 py-0.5 rounded bg-surface-secondary text-text-secondary font-mono ml-auto">{skill.id}</span>
            </div>
            <div className="space-y-3">
               {skill.tools.map(tool => (
                 <div key={tool.id} className="flex items-center justify-between group px-1">
                    <div className="flex flex-col gap-0.5">
                       <span className="text-[11px] font-mono font-bold text-text-primary">{tool.id}</span>
                       <span className="text-[10px] text-text-secondary leading-tight line-clamp-1">{tool.description}</span>
                    </div>
                    <button 
                      onClick={() => toggleTool(skill.id, tool.id, tool.enabled)}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        tool.enabled ? 'bg-emerald-500' : 'bg-surface-tertiary dark:bg-zinc-700'
                      }`}
                    >
                       <span
                         aria-hidden="true"
                         className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                           tool.enabled ? 'translate-x-4' : 'translate-x-0'
                         }`}
                       />
                    </button>
                 </div>
               ))}
            </div>
         </div>
       ))}
    </div>
  );
};

export default MCPSkillGovernance;
