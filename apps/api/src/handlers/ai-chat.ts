import { assistantSystemPrompt } from "@marble/api/ai/assistant-prompt";
import { createModel } from "@marble/api/ai/model";
import { createAssistantTools } from "@marble/api/ai/tools";
import {
  AssistantError,
  authorizeChat,
  requireVerifiedSession,
} from "@marble/api/services/assistant";
import {
  convertToModelMessages,
  safeValidateUIMessages,
  stepCountIs,
  streamText,
} from "ai";
import type { Handler } from "hono";
import { z } from "zod";
import { createRequestContext } from "../lib/context";
import type { DbVariables } from "../lib/db";
import type { LogVariables } from "../lib/logger";
import type { Env } from "../types/env";

const MAX_BODY_CHARS = 200_000;
const MAX_MESSAGES = 40;
const MAX_STEPS = 5;
const MAX_OUTPUT_TOKENS = 1024;

// Only the shape the guards need. The messages are checked in full against the
// tools' schemas once the caller is authorized. A client can't send "system"
// messages: the system prompt is ours.
const bodySchema = z.object({
  workspaceId: z.string().min(1),
  messages: z
    .array(z.looseObject({ role: z.enum(["user", "assistant"]) }))
    .min(1)
    .max(MAX_MESSAGES),
});

/**
 * `POST /ai/chat`: the dashboard assistant's streaming endpoint. It is a plain
 * Hono route because the AI SDK's UI message stream isn't an RPC response.
 *
 * Every guard runs before the model is called, in this order: a verified
 * session (401), membership of the workspace (403), a plan that includes the
 * assistant (403), and the per-user limits (429 with Retry-After).
 */
export const aiChat: Handler<{
  Bindings: Env;
  Variables: DbVariables & LogVariables;
}> = async (c) => {
  const ctx = await createRequestContext(c);

  try {
    const session = requireVerifiedSession(ctx.session);

    // Requiring JSON forces a CORS preflight on cross-origin requests, which
    // only the dashboard origin passes; a form post can't ride the cookie in.
    if (!c.req.header("content-type")?.includes("application/json")) {
      return c.json({ error: "Expected application/json" }, 415);
    }
    const text = await c.req.text();
    if (text.length > MAX_BODY_CHARS) {
      return c.json({ error: "Request too large" }, 413);
    }
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      return c.json({ error: "Invalid JSON" }, 400);
    }
    const body = bodySchema.safeParse(json);
    if (!body.success) {
      return c.json({ error: "Missing workspaceId or messages" }, 400);
    }
    const { workspaceId } = body.data;

    const { workspaceName } = await authorizeChat(
      ctx,
      session.user.id,
      workspaceId
    );
    ctx.log.set({ workspace: { id: workspaceId } });

    const tools = createAssistantTools({ ctx, workspaceId });
    const messages = await safeValidateUIMessages({
      messages: body.data.messages,
      tools,
    });
    if (!messages.success) {
      return c.json({ error: "Invalid messages" }, 400);
    }

    const { model, telemetry } = createModel(ctx);
    const result = streamText({
      model,
      telemetry,
      system: assistantSystemPrompt(workspaceName, new Date()),
      messages: await convertToModelMessages(messages.data, { tools }),
      tools,
      stopWhen: stepCountIs(MAX_STEPS),
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      abortSignal: c.req.raw.signal,
      onError: ({ error }) =>
        ctx.log.error(
          error instanceof Error ? error : new Error(String(error))
        ),
    });
    return result.toUIMessageStreamResponse();
  } catch (error) {
    if (error instanceof AssistantError) {
      if (error.retryAfterSeconds !== undefined) {
        c.header("Retry-After", String(error.retryAfterSeconds));
      }
      return c.json({ error: error.message }, error.status);
    }
    throw error;
  }
};
