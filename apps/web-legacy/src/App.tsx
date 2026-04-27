import React, { useState, useCallback, useEffect, useMemo } from 'react';
import ReactFlow, { Background, Controls, Panel, useNodesState, useEdgesState, addEdge, MarkerType, NodeProps, Handle, Position } from 'reactflow';
import 'reactflow/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Search, Database, Activity, Settings, Cpu, Zap, ChevronRight, History, ShieldCheck, Plus, Terminal, Globe, Send, Layers, ShieldAlert, ArrowRightLeft, GitMerge, Check, X, FileText, Book, Code, Menu } from 'lucide-react';
import { AgentPlayground } from './components/AgentPlayground';
import { ClarifyCenter } from './components/ClarifyCenter';
import { WikiPreview } from './components/WikiPreview';
import { ModelConfigPage } from './components/ModelConfigPage';
import { TracksPage } from './components/TracksPage';
import { cn } from './lib/utils';

// LibreChat 风格的导航宽度配置
export const NAV_WIDTH = {
  MOBILE: 320,
  DESKTOP: 260,
} as const;

const cn_util = (...classes: any[]) => classes.filter(Boolean).join(' ');

// 实际注册的工具信息
const REGISTERED_TOOLS = [
  { id: 'cas', name: 'CAS 存储', description: '内容寻址存储', icon: 'Database' },
  { id: 'vector', name: '向量操作', description: '向量数据库操作', icon: 'Activity' },
  { id: 'embedder', name: '文本嵌入', description: '文本向量化', icon: 'Code' },
  { id: 'retriever', name: '检索器', description: '向量相似度检索', icon: 'Search' },
  { id: 'reranker', name: '重排序', description: '结果重排序优化', icon: 'RefreshCw' },
  { id: 'aggregator', name: '聚合器', description: '多源数据聚合', icon: 'Layers' },
  { id: 'entity-linker', name: '实体链接', description: '实体关系提取', icon: 'GitMerge' },
  { id: 'code-analyzer', name: '代码分析', description: '代码结构分析', icon: 'FileText' },
  { id: 'graph-store', name: '图存储', description: '知识图谱存储', icon: 'Network' },
  { id: 'deduplicator', name: '去重器', description: '重复数据检测', icon: 'ShieldAlert' }
];

// 实际注册的轨道信息
const REGISTERED_TRACKS = [
  { id: 'track-insight', name: '知识轨道', icon: 'Database', description: '存储 LLM 提纯后的事实和结论', ops: ['ADD', 'RETRIEVE', 'UPDATE', 'DELETE', 'MERGE', 'LIST', 'EXPORT', 'DISTILL', 'ANCHOR', 'DIFF', 'SYNC'] },
  { id: 'track-source', name: '源代码轨道', icon: 'Code', description: '代码库分析和理解', ops: ['ADD', 'RETRIEVE', 'UPDATE', 'DELETE'] },
  { id: 'track-stream', name: '流轨道', icon: 'Globe', description: '实时数据流处理', ops: ['ADD', 'RETRIEVE'] },
  { id: 'track-wiki', name: '知识库轨道', icon: 'Book', description: '结构化知识管理', ops: ['ADD', 'RETRIEVE', 'UPDATE', 'DELETE', 'SEARCH'] }
];

// --- 节点定制 ---
const ToolNode = ({ data, selected }: NodeProps) => (
  <div className={cn_util("px-5 py-4 rounded-xl glass min-w-[200px] transition-all duration-700 border shadow-lg", selected ? "border-blue-500 ring-4 ring-blue-500/10 scale-105" : "border-white/5", data.isRunning && "animate-pulse border-emerald-500")}>
    <Handle type="target" position={Position.Top} className="!bg-zinc-800 border-none" />
    <div className="flex items-center gap-3">
      <div className={cn_util("p-2.5 rounded-lg", data.tool?.startsWith('builtin:') ? "bg-blue-500/10 text-blue-400" : "bg-purple-500/10 text-purple-400")}>
        {data.tool?.startsWith('builtin:') ? <Cpu size={18} /> : <Layers size={18} />}
      </div>
      <div className="flex flex-col overflow-hidden">
        <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest truncate">{data.step}</span>
        <span className="text-xs font-bold truncate text-white">{data.tool}</span>
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} className="!bg-zinc-800 border-none" />
  </div>
);

const AssetCard = ({ item, onClick }: { item: any, onClick?: () => void }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onClick={onClick} className="glass p-5 rounded-2xl group cursor-pointer hover:border-blue-500/20 transition-all border border-white/5">
    <div className="flex justify-between items-center mb-3">
      <span className="px-3 py-1 rounded-full bg-white/5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{item.trackId}</span>
      <span className="text-[10px] text-zinc-500 font-mono">{new Date(item.timestamp).toLocaleDateString()}</span>
    </div>
    <p className="text-sm line-clamp-3 text-zinc-300 leading-relaxed mb-4">{item.text || item.content}</p>
    <div className="flex flex-wrap gap-2">
      {(item.entities || []).map((e: string) => (
        <span key={e} className="text-[9px] px-2.5 py-1 rounded-full bg-blue-500/5 text-blue-400 border border-blue-500/10">{e}</span>
      ))}
    </div>
  </motion.div>
);

// 移动端导航遮罩
const NavMask = ({ navVisible, toggleNavVisible }: { navVisible: boolean; toggleNavVisible: () => void }) => (
  <div
    id="mobile-nav-mask-toggle"
    role="button"
    tabIndex={0}
    className={`nav-mask fixed inset-0 bg-black/50 z-[60] transition-opacity duration-200 ease-in-out md:hidden ${navVisible ? 'active opacity-100' : 'opacity-0 pointer-events-none'}`}
    onClick={toggleNavVisible}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        toggleNavVisible();
      }
    }}
    aria-label="Toggle navigation"
  />
);

// 轨道卡片组件
const TrackCard = ({ track, onClick }: { track: any, onClick?: (track: any) => void }) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Database': return <Database size={24} />;
      case 'Code': return <Code size={24} />;
      case 'Globe': return <Globe size={24} />;
      case 'Book': return <Book size={24} />;
      case 'Layers': return <Layers size={24} />;
      default: return <Box size={24} />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      onClick={() => onClick?.(track)}
      className="p-6 rounded-2xl border cursor-pointer transition-all hover:shadow-lg"
      style={{
        backgroundColor: 'var(--surface-secondary)',
        borderColor: 'var(--border-light)'
      }}
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--brand-purple)', color: 'white' }}>
          {getIcon(track.icon)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--text-primary)' }}>
            {track.name}
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {track.description}
          </p>
        </div>
      </div>

      <div className="mb-3">
        <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
          支持的操作
        </h4>
        <div className="flex flex-wrap gap-2">
          {track.ops.map((op: string) => (
            <span
              key={op}
              className="text-[10px] font-mono px-2 py-1 rounded-md"
              style={{
                backgroundColor: 'var(--surface-tertiary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-light)'
              }}
            >
              {op}
            </span>
          ))}
        </div>
      </div>

      <div className="pt-3 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-light)' }}>
        <span className="text-[10px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
          {track.id}
        </span>
        <span className="text-[10px]" style={{ color: 'var(--brand-purple)' }}>
          点击查看流程图 →
        </span>
      </div>
    </motion.div>
  );
};

// 移动端顶部导航栏
const MobileHeader = ({
  navVisible,
  setNavVisible,
  title
}: {
  navVisible: boolean;
  setNavVisible: React.Dispatch<React.SetStateAction<boolean>>;
  title: string;
}) => (
  <div className="bg-token-main-surface-primary sticky top-0 z-10 flex min-h-[40px] items-center justify-center bg-presentation pl-1 dark:text-white md:hidden" style={{ backgroundColor: 'var(--surface-primary)' }}>
    <button
      type="button"
      aria-label={navVisible ? "关闭侧边栏" : "打开侧边栏"}
      className="m-1 inline-flex size-10 items-center justify-center rounded-full hover:bg-surface-active-alt"
      onClick={() => setNavVisible(!navVisible)}
    >
      <Menu size={24} />
    </button>
    <h1 className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-center text-sm font-normal">
      {title}
    </h1>
    <button
      type="button"
      className="m-1 inline-flex size-10 items-center justify-center rounded-full hover:bg-surface-active-alt"
      onClick={() => {/* 新建对话 */}}
    >
      <Plus size={20} />
    </button>
  </div>
);

const App = () => {
  const [activeTab, setActiveTab] = useState('flow');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [sysInfo, setSysInfo] = useState<any>({ tracks: [], tools: [], config: {} });
  const [isLoaded, setIsLoaded] = useState(false);
  const [assets, setAssets] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [activeTraceNode, setActiveTraceNode] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [workspaces, setWorkspaces] = useState<string[]>(['default']);
  const [activeWorkspace, setActiveWorkspace] = useState('default');

  // LibreChat 风格的导航可见性状态
  const [navVisible, setNavVisible] = useState(true);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [showTrackFlow, setShowTrackFlow] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        // 移动端默认隐藏导航
        const savedNav = localStorage.getItem('navVisible');
        setNavVisible(savedNav === 'true');
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        // 尝试获取系统信息
        const metaRes = await fetch('/api/inspect')
          .then(r => {
            if (!r.ok) {
              throw new Error(`API error: ${r.status}`);
            }
            return r.json();
          })
          .catch(err => {
            console.log('API not available, using demo data:', err);
            // 返回模拟数据用于演示
            return {
              tracks: [{
                id: 'demo-track',
                name: '演示轨道',
                flows: {
                  'ADD': [
                    { step: '1', tool: 'builtin:text2mem', input: 'test data' },
                    { step: '2', tool: 'builtin:vectorize', input: 'embeddings' },
                    { step: '3', tool: 'builtin:store', input: 'storage' }
                  ]
                }
              }],
              tools: [
                { name: 'text2mem', description: '文本转记忆' },
                { name: 'vectorize', description: '向量化' },
                { name: 'store', description: '存储' }
              ]
            };
          });

        const wsRes = await fetch('/api/workspaces')
          .then(r => r.json())
          .catch(() => ({ workspaces: ['default'] }));

        setSysInfo(metaRes);
        setWorkspaces(wsRes.workspaces || ['default']);

        // 如果有轨道数据，显示轨道流程图
        if (metaRes.tracks && metaRes.tracks.length > 0) {
          mapFlowToGraph(metaRes.tracks[0], 'ADD');
        } else if (metaRes.tracks && metaRes.tracks.length === 0) {
          // 没有轨道数据时显示欢迎状态
          setNodes([]);
          setEdges([]);
        }
      } catch (e) {
        console.error('Init error:', e);
        // 确保在错误时也显示可用状态
        setNodes([]);
        setEdges([]);
      } finally {
        setIsLoaded(true);
      }
    };
    init();

    // WebSocket 连接（如果可用）
    try {
      const ws = new WebSocket(`ws://${window.location.host}/ws/trace`);
      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'KERNEL_EVENT') {
            setLogs(prev => [{ ...data.payload, time: new Date(data.timestamp).toLocaleTimeString() }, ...prev].slice(0, 100));
            if (data.payload.stage === 'start') {
              setActiveTraceNode(data.payload.trackId);
              setTimeout(() => setActiveTraceNode(null), 2000);
            }
          }
        } catch {}
      };
      ws.onerror = () => {
        console.log('WebSocket not available, continuing without real-time updates');
      };
      return () => ws.close();
    } catch (e) {
      console.log('WebSocket not supported:', e);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'assets') fetch('/api/assets').then(r => r.json()).then(d => setAssets(d.items || [])).catch(() => {});
  }, [activeTab]);

  // 切换工作区
  const onWorkspaceChange = async (newWs: string) => {
    setActiveWorkspace(newWs);
    setIsLoaded(false);
    try {
      const response = await fetch('/api/workspace/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newWs })
      });

      if (!response.ok) {
        throw new Error(`Failed to switch workspace: ${response.statusText}`);
      }

      const res = await fetch('/api/inspect');
      const data = await res.json();

      if (data && data.tracks && data.tracks.length > 0) {
        setSysInfo(data);
        mapFlowToGraph(data.tracks[0], 'ADD');
      } else {
        // 如果没有轨道数据，确保设置空状态
        setSysInfo(data || { tracks: [], tools: [] });
        setNodes([]);
        setEdges([]);
      }
    } catch (e) {
      console.error('Switch failed:', e);
      // 确保在错误时也设置加载状态
      setSysInfo({ tracks: [], tools: [] });
      setNodes([]);
      setEdges([]);
    } finally {
      setIsLoaded(true);
    }
  };

  const mapFlowToGraph = (track: any, op: string) => {
    const flow = track?.flows?.[op] || [];
    const newNodes = flow.map((step: any, i: number) => ({ id: `${track.id}-${op}-${i}`, type: 'tool', position: { x: 250, y: i * 150 }, data: { step: step.step, tool: step.tool, input: step.input } }));
    const newEdges = newNodes.slice(0, -1).map((n: any, i: number) => ({ id: `e-${i}`, source: n.id, target: newNodes[i+1].id, animated: true, style: { stroke: '#3b82f6', strokeWidth: 3 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' } }));
    setNodes(newNodes);
    setEdges(newEdges);
  };

  const processedNodes = useMemo(() => nodes.map(n => ({ ...n, data: { ...n.data, isRunning: activeTraceNode === n.id.split('-')[0] } })), [nodes, activeTraceNode]);

  // 切换导航可见性
  const toggleNavVisible = useCallback(() => {
    setNavVisible(prev => {
      const newValue = !prev;
      localStorage.setItem('navVisible', JSON.stringify(newValue));
      return newValue;
    });
  }, []);

  // 获取当前页面标题
  const currentPageTitle = useMemo(() => {
    const tabMap: Record<string, string> = {
      flow: '轨道',
      playground: 'Playground',
      clarify: 'Clarify Center',
      assets: 'Matrix',
      trace: 'Logs',
      config: '模型配置'
    };
    return tabMap[activeTab] || 'MemoHub';
  }, [activeTab]);

  // 导航菜单项
  const navItems = [
    { id: 'flow', icon: <Box size={18} />, label: '轨道' },
    { id: 'config', icon: <Settings size={18} />, label: '模型配置' },
    { id: 'playground', icon: <Terminal size={18} />, label: 'Playground' },
    { id: 'clarify', icon: <ShieldAlert size={18} />, label: 'Clarify' },
    { id: 'assets', icon: <Database size={18} />, label: 'Matrix' },
    { id: 'trace', icon: <Activity size={18} />, label: 'Logs' }
  ];

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
    backgroundColor: 'var(--surface-primary)',
    color: 'var(--text-primary)',
    fontFamily: 'system-ui, sans-serif'
  };

  return (
    <div style={containerStyle}>
      {/* 移动端顶部栏 */}
      <MobileHeader
        navVisible={navVisible}
        setNavVisible={setNavVisible}
        title={currentPageTitle}
      />

      {/* 导航遮罩层 */}
      <NavMask navVisible={navVisible} toggleNavVisible={toggleNavVisible} />
      {/* 移动端顶部栏 */}
      <MobileHeader
        navVisible={navVisible}
        setNavVisible={setNavVisible}
        title={currentPageTitle}
      />

      {/* 导航遮罩层 */}
      <NavMask navVisible={navVisible} toggleNavVisible={toggleNavVisible} />

      {/* LibreChat 风格的响应式侧边栏 */}
      {isSmallScreen ? (
        // 移动端：固定定位，滑动效果
        <motion.div
          data-testid="nav"
          className="nav fixed left-0 top-0 z-[70] h-full"
          style={{
            width: NAV_WIDTH.MOBILE,
            backgroundColor: 'var(--surface-secondary)',
            paddingTop: '40px' // 为顶部栏留出空间
          }}
          initial={false}
          animate={{
            x: navVisible ? 0 : -NAV_WIDTH.MOBILE,
          }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-3 border-b px-6 py-6" style={{ borderColor: 'var(--border-light)' }}>
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <Zap size={16} className="text-white fill-white" />
              </div>
              <span style={{ fontSize: '1.125rem', fontWeight: 800 }} className="text-text-primary">
                MemoHub
              </span>
            </div>
            <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (isSmallScreen) toggleNavVisible();
                  }}
                  className={cn(
                    "nav-item w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                    activeTab === item.id ? "nav-item-active" : ""
                  )}
                >
                  {item.icon}
                  <span className="font-medium text-sm">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </motion.div>
      ) : (
        // 桌面端：正常显示
        <motion.div
          data-testid="nav"
          className="nav h-full border-r"
          style={{
            width: navVisible ? NAV_WIDTH.DESKTOP : '0px',
            backgroundColor: 'var(--surface-secondary)',
            borderColor: 'var(--border-light)',
            overflow: 'hidden'
          }}
          initial={false}
          animate={{
            width: navVisible ? NAV_WIDTH.DESKTOP : '0px'
          }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-3 border-b px-6 py-6" style={{ borderColor: 'var(--border-light)' }}>
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <Zap size={16} className="text-white fill-white" />
              </div>
              {navVisible && (
                <span style={{ fontSize: '1.125rem', fontWeight: 800 }} className="text-text-primary">
                  MemoHub
                </span>
              )}
            </div>
            {navVisible && (
              <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      "nav-item w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                      activeTab === item.id ? "nav-item-active" : ""
                    )}
                  >
                    {item.icon}
                    <span className="font-medium text-sm">{item.label}</span>
                  </button>
                ))}
              </nav>
            )}
          </div>
        </motion.div>
      )}

      {/* 主内容区域 */}
      <main className="flex-1 flex flex-col overflow-hidden" style={{
        marginLeft: isSmallScreen ? 0 : (navVisible ? '0px' : '0px'),
        transition: 'margin-left 0.2s ease-out'
      }}>
        {/* 桌面端头部 */}
        {!isSmallScreen && (
          <header className="h-14 border-b flex items-center justify-between px-6" style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--surface-secondary)' }}>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setNavVisible(!navVisible)}
                className="p-2 rounded-lg hover:bg-surface-hover transition-colors"
                title="Toggle Navigation"
              >
                <Menu size={20} />
              </button>
              <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
                Workspaces / <span style={{ color: 'var(--text-primary)' }}>{activeWorkspace}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsEntryModalOpen(true)} className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-surface-hover transition-all" style={{ backgroundColor: 'var(--brand-purple)', color: 'white' }}>
                <Plus size={18} />
              </button>
            </div>
          </header>
        )}

        {/* 内容区 */}
        <div className="flex-1 relative overflow-hidden">
          {!isLoaded ? (
            <div className="flex-1 flex items-center justify-center font-mono text-blue-500 animate-pulse">
              Booting Memory OS...
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full w-full overflow-auto"
              >
                {activeTab === 'flow' && (
                  <div className="h-full w-full">
                    <TracksPage />
                  </div>
                )}
                {activeTab === 'config' && (
                  <div className="h-full w-full">
                    <ModelConfigPage />
                  </div>
                )}
                {activeTab === 'playground' && (
                  <div className="h-full w-full">
                    <AgentPlayground />
                  </div>
                )}
                {activeTab === 'clarify' && (
                  <div className="h-full w-full">
                    <ClarifyCenter />
                  </div>
                )}
                {activeTab === 'trace' && (
                  <div className="p-12 h-full overflow-auto font-mono text-xs">
                    {logs.map((log, i) => (
                      <div key={i} className="mb-2" style={{ color: 'var(--text-secondary)' }}>
                        [{log.time}] {log.trackId} - {log.stage}
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === 'assets' && (
                  <div className="h-full flex">
                    <div className="flex-1 p-12 overflow-auto">
                      <div className="max-w-5xl mx-auto grid grid-cols-2 gap-6">
                        {assets.map((asset, i) => (
                          <AssetCard key={i} item={asset} onClick={() => setSelectedAsset(asset)} />
                        ))}
                      </div>
                    </div>
                    {selectedAsset && (
                      <div className="w-1/2 border-l" style={{ borderColor: 'var(--border-light)' }}>
                        <WikiPreview
                          assetId={selectedAsset.id}
                          content={selectedAsset.text || selectedAsset.content}
                          onClose={() => setSelectedAsset(null)}
                        />
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;