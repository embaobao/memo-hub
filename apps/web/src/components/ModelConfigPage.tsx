import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Settings, Plus, Trash2, Edit2, Check, X, RefreshCw, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModelConfig {
  id: string;
  name: string;
  provider: string; // 'ollama' | 'openai' | 'anthropic' | etc.
  model: string;
  endpoint?: string;
  apiKey?: string;
  enabled: boolean;
  config: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
  };
}

const DEFAULT_CONFIGS: ModelConfig[] = [
  {
    id: 'ollama-llama3',
    name: 'Llama 3 (Ollama)',
    provider: 'ollama',
    model: 'llama3',
    enabled: true,
    config: {
      temperature: 0.7,
      maxTokens: 4096,
      topP: 0.9
    }
  },
  {
    id: 'ollama-mistral',
    name: 'Mistral (Ollama)',
    provider: 'ollama',
    model: 'mistral',
    enabled: false,
    config: {
      temperature: 0.7,
      maxTokens: 4096,
      topP: 0.9
    }
  },
  {
    id: 'openai-gpt4',
    name: 'GPT-4 (OpenAI)',
    provider: 'openai',
    model: 'gpt-4',
    endpoint: 'https://api.openai.com/v1',
    enabled: false,
    config: {
      temperature: 0.7,
      maxTokens: 4096,
      topP: 0.9,
      frequencyPenalty: 0,
      presencePenalty: 0
    }
  }
];

interface ModelCardProps {
  config: ModelConfig;
  onEdit: (config: ModelConfig) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
}

const ModelCard: React.FC<ModelCardProps> = ({ config, onEdit, onDelete, onToggle }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border transition-all"
      style={{
        backgroundColor: 'var(--surface-secondary)',
        borderColor: config.enabled ? 'var(--brand-purple)' : 'var(--border-light)',
        opacity: config.enabled ? 1 : 0.6
      }}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg" style={{
              backgroundColor: config.enabled ? 'var(--brand-purple)' : 'var(--surface-tertiary)',
              color: config.enabled ? 'white' : 'var(--text-secondary)'
            }}>
              <Cpu size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                {config.name}
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {config.provider} / {config.model}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggle(config.id, !config.enabled)}
              className={cn(
                "relative w-11 h-6 rounded-full transition-colors duration-200",
                config.enabled ? "bg-[var(--brand-purple)]" : "bg-[var(--surface-tertiary)]"
              )}
            >
              <motion.div
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md"
                animate={{ left: config.enabled ? 28 : 4 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm flex items-center gap-1 transition-colors"
            style={{ color: 'var(--brand-purple)' }}
          >
            {isExpanded ? '隐藏配置' : '查看配置'}
            <Zap size={14} />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(config)}
              className="p-2 rounded-lg transition-colors hover:bg-surface-hover"
              style={{ color: 'var(--text-secondary)' }}
              title="编辑配置"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={() => onDelete(config.id)}
              className="p-2 rounded-lg transition-colors hover:bg-surface-hover"
              style={{ color: 'var(--text-secondary)' }}
              title="删除配置"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 pt-4 border-t"
              style={{ borderColor: 'var(--border-light)' }}
            >
              <div className="grid grid-cols-2 gap-4 text-sm">
                {config.endpoint && (
                  <div>
                    <div className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-secondary)' }}>
                      Endpoint
                    </div>
                    <div className="font-mono text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {config.endpoint}
                    </div>
                  </div>
                )}
                {config.apiKey && (
                  <div>
                    <div className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-secondary)' }}>
                      API Key
                    </div>
                    <div className="font-mono text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {config.apiKey.substring(0, 8)}...
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-secondary)' }}>
                    Temperature
                  </div>
                  <div style={{ color: 'var(--text-primary)' }}>
                    {config.config.temperature?.toFixed(1) || 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-secondary)' }}>
                    Max Tokens
                  </div>
                  <div style={{ color: 'var(--text-primary)' }}>
                    {config.config.maxTokens || 'N/A'}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

interface ModelConfigModalProps {
  config?: ModelConfig;
  onSave: (config: ModelConfig) => void;
  onClose: () => void;
}

const ModelConfigModal: React.FC<ModelConfigModalProps> = ({ config, onSave, onClose }) => {
  const [formData, setFormData] = useState<ModelConfig>(
    config || {
      id: `model-${Date.now()}`,
      name: '',
      provider: 'ollama',
      model: '',
      enabled: true,
      config: {
        temperature: 0.7,
        maxTokens: 4096,
        topP: 0.9
      }
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="max-w-2xl w-full max-h-[80vh] overflow-auto rounded-2xl p-6"
        style={{ backgroundColor: 'var(--surface-secondary)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {config ? '编辑模型配置' : '添加模型配置'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-hover transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              配置名称
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-surface-tertiary border border-white/10 text-white focus:outline-none focus:border-purple-500/50"
              placeholder="例如: GPT-4 (OpenAI)"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                提供商
              </label>
              <select
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value as any })}
                className="w-full px-4 py-3 rounded-xl bg-surface-tertiary border border-white/10 text-white focus:outline-none focus:border-purple-500/50"
              >
                <option value="ollama">Ollama</option>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="custom">自定义</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                模型名称
              </label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-surface-tertiary border border-white/10 text-white focus:outline-none focus:border-purple-500/50"
                placeholder="例如: gpt-4, llama3"
                required
              />
            </div>
          </div>

          {(formData.provider === 'openai' || formData.provider === 'anthropic' || formData.provider === 'custom') && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Endpoint
                </label>
                <input
                  type="text"
                  value={formData.endpoint || ''}
                  onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-surface-tertiary border border-white/10 text-white focus:outline-none focus:border-purple-500/50"
                  placeholder="https://api.example.com/v1"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                  API Key
                </label>
                <input
                  type="password"
                  value={formData.apiKey || ''}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-surface-tertiary border border-white/10 text-white focus:outline-none focus:border-purple-500/50"
                  placeholder="sk-..."
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              模型参数
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Temperature (0-2)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  value={formData.config.temperature || 0.7}
                  onChange={(e) => setFormData({
                    ...formData,
                    config: { ...formData.config, temperature: parseFloat(e.target.value) }
                  })}
                  className="w-full px-4 py-3 rounded-xl bg-surface-tertiary border border-white/10 text-white focus:outline-none focus:border-purple-500/50"
                />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Max Tokens
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.config.maxTokens || 4096}
                  onChange={(e) => setFormData({
                    ...formData,
                    config: { ...formData.config, maxTokens: parseInt(e.target.value) }
                  })}
                  className="w-full px-4 py-3 rounded-xl bg-surface-tertiary border border-white/10 text-white focus:outline-none focus:border-purple-500/50"
                />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Top P (0-1)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  value={formData.config.topP || 0.9}
                  onChange={(e) => setFormData({
                    ...formData,
                    config: { ...formData.config, topP: parseFloat(e.target.value) }
                  })}
                  className="w-full px-4 py-3 rounded-xl bg-surface-tertiary border border-white/10 text-white focus:outline-none focus:border-purple-500/50"
                />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Frequency Penalty
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="-2"
                  max="2"
                  value={formData.config.frequencyPenalty || 0}
                  onChange={(e) => setFormData({
                    ...formData,
                    config: { ...formData.config, frequencyPenalty: parseFloat(e.target.value) }
                  })}
                  className="w-full px-4 py-3 rounded-xl bg-surface-tertiary border border-white/10 text-white focus:outline-none focus:border-purple-500/50"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl font-bold transition-colors"
              style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--surface-tertiary)' }}
            >
              取消
            </button>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl font-bold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: 'var(--brand-purple)' }}
            >
              {config ? '保存更改' : '添加配置'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export const ModelConfigPage: React.FC = () => {
  const [configs, setConfigs] = useState<ModelConfig[]>(DEFAULT_CONFIGS);
  const [editingConfig, setEditingConfig] = useState<ModelConfig | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 从服务器加载配置
  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/models');
      if (response.ok) {
        const data = await response.json();
        setConfigs(data.models || DEFAULT_CONFIGS);
      }
    } catch (error) {
      console.error('Failed to load model configs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (config: ModelConfig) => {
    try {
      const method = editingConfig ? 'PUT' : 'POST';
      const response = await fetch('/api/models', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        if (editingConfig) {
          setConfigs(configs.map(c => c.id === config.id ? config : c));
        } else {
          setConfigs([...configs, config]);
        }
        setIsModalOpen(false);
        setEditingConfig(undefined);
      }
    } catch (error) {
      console.error('Failed to save model config:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/models/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setConfigs(configs.filter(c => c.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete model config:', error);
    }
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      const config = configs.find(c => c.id === id);
      if (config) {
        const response = await fetch(`/api/models/${id}/toggle`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled })
        });

        if (response.ok) {
          setConfigs(configs.map(c => c.id === id ? { ...c, enabled } : c));
        }
      }
    } catch (error) {
      console.error('Failed to toggle model config:', error);
    }
  };

  return (
    <div className="h-full w-full overflow-auto p-8">
      <div className="max-w-6xl mx-auto">
        {/* 页面标题 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              模型配置
            </h1>
            <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
              管理和配置 AI 模型提供商
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadConfigs}
              className="px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2"
              style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--surface-tertiary)' }}
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              刷新
            </button>
            <button
              onClick={() => {
                setEditingConfig(undefined);
                setIsModalOpen(true);
              }}
              className="px-4 py-2 rounded-lg font-bold text-white transition-all hover:opacity-90 flex items-center gap-2"
              style={{ backgroundColor: 'var(--brand-purple)' }}
            >
              <Plus size={16} />
              添加模型
            </button>
          </div>
        </div>

        {/* 模型配置列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {configs.map(config => (
            <ModelCard
              key={config.id}
              config={config}
              onEdit={(config) => {
                setEditingConfig(config);
                setIsModalOpen(true);
              }}
              onDelete={handleDelete}
              onToggle={handleToggle}
            />
          ))}
        </div>

        {/* 模态框 */}
        <AnimatePresence>
          {isModalOpen && (
            <ModelConfigModal
              config={editingConfig}
              onSave={handleSave}
              onClose={() => {
                setIsModalOpen(false);
                setEditingConfig(undefined);
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ModelConfigPage;
