import { z } from "zod";
import { MemoOp, type Text2MemInstruction } from "./types.js";

export const MemoOpSchema = z.nativeEnum(MemoOp);

/**
 * @internal
 */
export const Text2MemInstructionSchema = z.object({
  op: MemoOpSchema,
  trackId: z.string().min(1),
  payload: z.unknown(),
  context: z.record(z.any()).optional(),
  meta: z.record(z.any()).optional(),
});

export function validateInstruction(input: unknown): {
  success: boolean;
  data?: Text2MemInstruction;
  error?: string;
} {
  const result = Text2MemInstructionSchema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data as Text2MemInstruction };
  }
  return {
    success: false,
    error: result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; "),
  };
}
