import { IntegrationHub } from "@memohub/integration-hub";
import type { Text2MemInstruction } from "@memohub/protocol";

type KernelLike = {
  getCAS(): unknown;
  dispatch(instruction: Text2MemInstruction): Promise<unknown>;
};

/**
 * 从 kernel 组装统一的 IntegrationHub 实例。
 */
export function createIntegrationHubFromKernel(kernel: KernelLike) {
  return new IntegrationHub({
    cas: kernel.getCAS() as never,
    kernel: kernel as never,
  });
}
