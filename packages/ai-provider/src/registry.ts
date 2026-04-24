import type { IEmbedder, ICompleter } from './types.js';

export type AdapterFactory<T> = (config: any) => T;

export class AIProviderRegistry {
  private embedderFactories = new Map<string, AdapterFactory<IEmbedder>>();
  private completerFactories = new Map<string, AdapterFactory<ICompleter>>();
  private embedders = new Map<string, IEmbedder>();
  private completers = new Map<string, ICompleter>();

  registerEmbedder(name: string, factory: AdapterFactory<IEmbedder>): void {
    this.embedderFactories.set(name, factory);
  }

  registerCompleter(name: string, factory: AdapterFactory<ICompleter>): void {
    this.completerFactories.set(name, factory);
  }

  getEmbedder(name: string, config?: any): IEmbedder {
    const cached = this.embedders.get(name);
    if (cached) return cached;

    const factory = this.embedderFactories.get(name);
    if (!factory) {
      throw new Error(`Embedder adapter '${name}' not registered. Available: ${Array.from(this.embedderFactories.keys()).join(', ')}`);
    }

    const instance = factory(config);
    this.embedders.set(name, instance);
    return instance;
  }

  getCompleter(name: string, config?: any): ICompleter {
    const cached = this.completers.get(name);
    if (cached) return cached;

    const factory = this.completerFactories.get(name);
    if (!factory) {
      throw new Error(`Completer adapter '${name}' not registered. Available: ${Array.from(this.completerFactories.keys()).join(', ')}`);
    }

    const instance = factory(config);
    this.completers.set(name, instance);
    return instance;
  }
}
