import { AgentConfig, ProviderConfig } from "@memohub/config";
import {
  IEmbedder,
  ICompleter,
  AIProviderRegistry,
  OllamaAdapter,
  MockAdapter,
} from "@memohub/ai-provider";

export class AIHub {
  private providers = new Map<string, any>();
  private agents = new Map<string, AgentConfig>();
  private registry = new AIProviderRegistry();

  constructor(
    providers: ProviderConfig[],
    agents: Record<string, AgentConfig>,
  ) {
    // Register default adapters
    this.registry.registerEmbedder(
      "ollama",
      (config) => new OllamaAdapter(config as any),
    );
    this.registry.registerCompleter(
      "ollama",
      (config) => new OllamaAdapter(config as any),
    );
    this.registry.registerEmbedder("mock", () => new MockAdapter());
    this.registry.registerCompleter("mock", () => new MockAdapter());

    // Initialize providers
    for (const p of providers) {
      this.providers.set(p.id, p);
    }

    // Register agents
    for (const [id, agent] of Object.entries(agents)) {
      this.agents.set(id, agent);
    }
  }

  /**
   * Get an embedder for a specific agent role.
   */
  public getEmbedder(agentId: string): IEmbedder {
    const agent = this.agents.get(agentId);
    if (!agent) throw new Error(`Agent not found: ${agentId}`);

    const provider = this.providers.get(agent.provider);
    if (!provider)
      throw new Error(
        `Provider not found: ${agent.provider} for agent ${agentId}`,
      );

    // Here we wrap the existing AIProviderRegistry logic
    return this.registry.getEmbedder(provider.type, {
      url: provider.url,
      embeddingModel: agent.model,
      dimensions: agent.dimensions,
      apiKey: provider.apiKey,
      ...provider.config,
    });
  }

  /**
   * Get a completer for a specific agent role.
   */
  public getCompleter(agentId: string): ICompleter {
    const agent = this.agents.get(agentId);
    if (!agent) throw new Error(`Agent not found: ${agentId}`);

    const provider = this.providers.get(agent.provider);
    if (!provider)
      throw new Error(
        `Provider not found: ${agent.provider} for agent ${agentId}`,
      );

    return this.registry.getCompleter(provider.type, {
      url: provider.url,
      chatModel: agent.model,
      apiKey: provider.apiKey,
      temperature: agent.temperature,
      ...provider.config,
    });
  }
}
