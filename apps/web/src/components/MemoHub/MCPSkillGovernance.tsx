import React, { useState, useEffect } from 'react';
import { ShieldCheck, ToggleLeft, ToggleRight, Box } from 'lucide-react';

const MCPSkillGovernance = () => {
  const [skills, setSkills] = useState([]);

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
     });
  };

  return (
    <div className="space-y-6 p-4">
       {skills.map(skill => (
         <div key={skill.id} className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black/20">
            <div className="flex items-center gap-3 mb-4">
               <ShieldCheck size={18} className="text-emerald-500" />
               <span className="font-bold text-sm">{skill.name}</span>
               <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono">{skill.id}</span>
            </div>
            <div className="space-y-2 pl-7">
               {skill.tools.map(tool => (
                 <div key={tool.id} className="flex items-center justify-between group">
                    <div className="flex flex-col">
                       <span className="text-xs font-mono font-medium">{tool.id}</span>
                       <span className="text-[10px] text-zinc-500 italic">{tool.description}</span>
                    </div>
                    <button 
                      onClick={() => toggleTool(skill.id, tool.id, tool.enabled)}
                      className="transition-transform active:scale-90"
                    >
                       {tool.enabled ? (
                         <ToggleRight className="text-emerald-500" size={24} />
                       ) : (
                         <ToggleLeft className="text-zinc-400 opacity-50" size={24} />
                       )}
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
