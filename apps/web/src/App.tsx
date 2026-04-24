import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Activity, Database, Settings, Search, Box } from 'lucide-react';

const App = () => {
  const [activeTab, setActiveTab] = useState('flow');

  const navItems = [
    { id: 'flow', icon: <Box size={18} />, label: 'Studio' },
    { id: 'search', icon: <Search size={18} />, label: 'Omni' },
    { id: 'assets', icon: <Database size={18} />, label: 'Assets' },
    { id: 'trace', icon: <Activity size={18} />, label: 'Trace' },
    { id: 'settings', icon: <Settings size={18} />, label: 'Config' },
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground selection:bg-accent-insight selection:text-white">
      {/* Sidebar - iOS Glassmorphism */}
      <aside className="w-64 glass border-r flex flex-col z-50">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-accent-insight to-accent-source shadow-lg shadow-accent-insight/20" />
            <span className="font-bold tracking-tight text-lg">MemoHub</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group ${
                activeTab === item.id 
                  ? 'bg-foreground/5 text-foreground' 
                  : 'text-zinc-500 hover:bg-foreground/5 hover:text-foreground'
              }`}
            >
              <span className={`transition-transform duration-300 ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`}>
                {item.icon}
              </span>
              <span className="font-medium text-sm">{item.label}</span>
              {activeTab === item.id && (
                <motion.div 
                  layoutId="active-pill"
                  className="ml-auto w-1 h-4 rounded-full bg-accent-insight" 
                />
              )}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-border mt-auto">
          <div className="flex items-center gap-3 glass p-3 rounded-2xl">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-mono text-zinc-400">Kernel Active</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-8 border-b border-border z-40">
           <div className="flex items-center gap-4">
              <span className="text-sm font-semibold capitalize text-zinc-400">Workspace / </span>
              <span className="text-sm font-bold">Default</span>
           </div>
           <div className="flex gap-4">
              <div className="h-8 w-8 rounded-full glass border flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
                <span className="text-[10px] font-bold">V1</span>
              </div>
           </div>
        </header>

        {/* Canvas / Viewport */}
        <div className="flex-1 overflow-auto p-8">
           <AnimatePresence mode="wait">
             <motion.div
               key={activeTab}
               initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
               animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
               exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
               transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
               className="h-full"
             >
                {activeTab === 'flow' && (
                  <div className="h-full rounded-3xl border-2 border-dashed border-border flex items-center justify-center">
                    <p className="text-zinc-500 font-mono text-sm italic">Flow Canvas Loading...</p>
                  </div>
                )}
                {activeTab !== 'flow' && (
                   <div className="grid grid-cols-3 gap-6">
                      {[1,2,3,4,5,6].map(i => (
                        <div key={i} className="glass p-6 rounded-3xl h-48 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-75">
                           <div className="h-2 w-12 rounded-full bg-border mb-4" />
                           <div className="h-4 w-3/4 rounded-full bg-border mb-2" />
                           <div className="h-4 w-1/2 rounded-full bg-border" />
                        </div>
                      ))}
                   </div>
                )}
             </motion.div>
           </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default App;
