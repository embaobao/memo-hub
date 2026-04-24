import React from 'react';
import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">MemoHub Flow Visualizer</h1>
        <div className="flex gap-4">
          <button className="px-4 py-2 bg-blue-600 rounded">Load Config</button>
          <button className="px-4 py-2 bg-green-600 rounded">Save Changes</button>
        </div>
      </header>
      <div className="flex flex-1" style={{ height: 'calc(100vh - 64px)' }}>
        <aside className="w-64 bg-slate-100 p-4 border-r border-slate-300">
          <h2 className="font-semibold mb-2">Available Tools</h2>
          <div className="space-y-2">
            <div className="p-2 bg-white rounded border border-slate-300 cursor-move">builtin:cas</div>
            <div className="p-2 bg-white rounded border border-slate-300 cursor-move">builtin:vector</div>
            <div className="p-2 bg-white rounded border border-slate-300 cursor-move">nlp:extractor</div>
          </div>
        </aside>
        <main className="flex-1">
          <ReactFlow nodes={[]} edges={[]}>
            <Background />
            <Controls />
          </ReactFlow>
        </main>
      </div>
    </div>
  );
}

export default App;
