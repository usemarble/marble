import { createGateway, type LanguageModel } from "ai";
import type { RequestLogger } from "evlog";
import { createAILogger, createEvlogIntegration } from "evlog/ai";
import type { ServiceContext } from "../context";

/** A model ID in the Vercel AI Gateway's catalog. */
export const MODEL_ID = "openai/gpt-5.4-mini";

/**
 * Logs every call the model makes (tokens, tools, timings) to the request's
 * wide event under `ai.*`. Pass `telemetry` to `generateText` / `streamText` so
 * tool executions are captured too.
 */
export function wrapModel(log: RequestLogger, base: LanguageModel) {
  const ai = createAILogger(log);
  return {
    model: ai.wrap(base),
    telemetry: { integrations: [createEvlogIntegration(ai)] },
  };
}

/**
 * The only place a provider or model is named. To run on Workers AI instead,
 * add an `AI` binding in cloudflare.config.ts and swap `base` for
 * `createWorkersAI({ binding: ctx.env.AI })("<model>")` from
 * `workers-ai-provider`; nothing else changes.
 */
export function createModel(ctx: Pick<ServiceContext, "env" | "log">) {
  const gateway = createGateway({ apiKey: ctx.env.AI_GATEWAY_API_KEY });
  return {
    ...wrapModel(ctx.log, gateway(MODEL_ID)),
    // AI SDK 7 sends OpenAI's strict structured-output mode by default, which
    // rejects any schema with an optional property (readability suggestions
    // have two). Spread this into every generateText / streamText call.
    providerOptions: { openai: { strictJsonSchema: false } },
  };
}
