import { AgentConfig, ProviderConfig } from '@memohub/config';
import { IEmbedder, ICompleter } from '@memohub/ai-provider';
export declare class AIHub {
    private providers;
    private agents;
    private registry;
    constructor(providers: ProviderConfig[], agents: Record<string, AgentConfig>);
    /**
     * Get an embedder for a specific agent role.
     */
    getEmbedder(agentId: string): IEmbedder;
    /**
     * Get a completer for a specific agent role.
     */
    getCompleter(agentId: string): ICompleter;
}
//# sourceMappingURL=ai-hub.d.ts.map