import { IEmbedder, ICompleter, AIProviderRegistry, OllamaAdapter, MockAdapter } from '@memohub/ai-provider';

export class AIHub {
  private providers = new Map<string, any>();
  private registry: AIProviderRegistry;

  constructor(providers: any[], agents: any) {
    this.registry = new AIProviderRegistry();
    this.registry.registerEmbedder('ollama', (config) => new OllamaAdapter(config));
    this.registry.registerCompleter('ollama', (config) => new OllamaAdapter(config));
    this.registry.registerEmbedder('mock', (config) => new MockAdapter());
    this.registry.registerCompleter('mock', (config) => new MockAdapter());
    
    // 初始化 providers
    providers.forEach(p => this.providers.set(p.id, p));
  }

  public getEmbedder(id: string = 'embedder'): IEmbedder {
    // 简化逻辑：直接从第一个可用 provider 获取
    const p = Array.from(this.providers.values())[0];
    if (!p) throw new Error("No AI provider found");
    return this.registry.getEmbedder(p.type, { url: p.url, embeddingModel: 'nomic-embed-text' });
  }

  public getCompleter(id: string = 'summarizer'): ICompleter {
    const p = Array.from(this.providers.values())[0];
    if (!p) throw new Error("No AI provider found");
    return this.registry.getCompleter(p.type, { url: p.url, chatModel: 'qwen2.5:7b' });
  }
}
