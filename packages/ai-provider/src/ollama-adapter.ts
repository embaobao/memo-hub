import type { IEmbedder, ICompleter, ChatMessage } from './types.js';
import { AIProviderError } from './types.js';

export interface OllamaConfig {
  url: string;
  embeddingModel: string;
  chatModel?: string;
  dimensions: number;
  timeout: number;
}

export class OllamaAdapter implements IEmbedder, ICompleter {
  private config: OllamaConfig;

  constructor(config: OllamaConfig) {
    this.config = config;
  }

  async embed(text: string): Promise<number[]> {
    const controller = new AbortController();
    const timeoutVal = this.config.timeout || 30;
    const timeout = setTimeout(() => controller.abort(), timeoutVal * 1000);

    try {
      const response = await fetch(`${this.config.url}/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: this.config.embeddingModel, input: text }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new AIProviderError(
          `Embedding API error: ${response.status} ${response.statusText}`,
          'ollama',
        );
      }

      const json = (await response.json()) as any;
      return json.data[0].embedding as number[];
    } catch (error) {
      if (error instanceof AIProviderError) throw error;
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new AIProviderError('Embedding request timed out', 'ollama');
      }
      throw new AIProviderError(
        `Embedding failed: ${error instanceof Error ? error.message : String(error)}`,
        'ollama',
        error instanceof Error ? error : undefined,
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  async batchEmbed(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map((t) => this.embed(t)));
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    const chatModel = this.config.chatModel;
    if (!chatModel) {
      throw new AIProviderError('No chat model configured', 'ollama');
    }

    const controller = new AbortController();
    const timeoutVal = this.config.timeout || 30;
    const timeout = setTimeout(() => controller.abort(), timeoutVal * 1000);

    try {
      const response = await fetch(`${this.config.url}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: chatModel, messages }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new AIProviderError(
          `Chat API error: ${response.status} ${response.statusText}`,
          'ollama',
        );
      }

      const json = (await response.json()) as any;
      return json.choices[0].message.content as string;
    } catch (error) {
      if (error instanceof AIProviderError) throw error;
      throw new AIProviderError(
        `Chat failed: ${error instanceof Error ? error.message : String(error)}`,
        'ollama',
        error instanceof Error ? error : undefined,
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  async summarize(text: string): Promise<string> {
    return this.chat([
      { role: 'system', content: 'Summarize the following text concisely.' },
      { role: 'user', content: text },
    ]);
  }
}
