import { ConfigManager } from "../core/config.js";
import { ContentAddressableStorage } from "../core/cas.js";
import { Embedder } from "../core/embedder.js";
import { ClawMem } from "../lib/clawmem.js";
import { GBrain } from "../lib/gbrain.js";
import { MemoEngine } from "../pipeline/engine.js";
import { ClawMemTrackProvider } from "../pipeline/providers/clawmem-provider.js";
import { GBrainTrackProvider } from "../pipeline/providers/gbrain-provider.js";

/**
 * createDefaultEngine：以“项目现有组件”为基础装配 MemoEngine
 *
 * 设计原则：
 * - 复用现有 ConfigManager / Embedder / GBrain / ClawMem，避免引入第二套初始化逻辑
 * - 通过 Provider 适配器接入新管道引擎，确保兼容性与渐进演进
 */
export async function createDefaultEngine(options: { configPath?: string } = {}): Promise<{
  engine: MemoEngine;
}> {
  const { configPath } = options ?? {};

  const configManager = new ConfigManager(configPath);
  configManager.applyEnvOverrides();
  const config = configManager.getConfig();

  const embedder = new Embedder(config.embedding);
  const cas = new ContentAddressableStorage(
    config.cas ?? { root_path: "~/.hermes/data/memohub-cas" }
  );

  const gbrain = new GBrain(config.gbrain, embedder, cas);
  const clawmem = new ClawMem(config.clawmem, embedder, cas);

  const providers = [new GBrainTrackProvider(gbrain), new ClawMemTrackProvider(clawmem)];

  const engine = new MemoEngine({
    providers,
    cas,
    routing: config.routing,
  });

  await engine.initialize();

  return { engine };
}

