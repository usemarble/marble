import { createHash } from "node:crypto";
import { post } from "@marble/db/schema";
import { htmlToMarkdown } from "@marble/parser";
import { canPerformAction } from "@marble/utils";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { generateText, Output } from "ai";
import { and, eq } from "drizzle-orm";
import type { z } from "zod";
import { createModel } from "../ai/model";
import { systemPrompt } from "../ai/readability-prompt";
import type { ServiceContext } from "../context";
import {
  type aiReadabilityBodySchema,
  aiReadabilityResponseSchema,
  MAX_AI_READABILITY_MODEL_CONTENT_LENGTH,
} from "../lib/readability-validation";
import { getWorkspacePlan } from "./access";

/** Failures the caller caused or can fix; the router maps them to oRPC codes. */
export class ReadabilityError extends Error {
  readonly status: 403 | 404 | 429;
  readonly rateLimit?: { limit: number; remaining: number; reset: number };

  constructor(
    status: 403 | 404 | 429,
    message: string,
    rateLimit?: ReadabilityError["rateLimit"]
  ) {
    super(message);
    this.status = status;
    this.rateLimit = rateLimit;
  }
}

type Metrics = z.infer<typeof aiReadabilityBodySchema>["metrics"];
type Suggestions = z.infer<typeof aiReadabilityResponseSchema>;

const CACHE_TTL_SECONDS = 1200;

function createContentHash(content: string, metrics: Metrics): string {
  const contentHash = createHash("sha256")
    .update(content)
    .digest("hex")
    .slice(0, 16);
  const metricsHash = createHash("sha256")
    .update(
      JSON.stringify({
        w: metrics.wordCount,
        s: metrics.sentenceCount,
        wps: metrics.wordsPerSentence,
        rs: metrics.readabilityScore,
        rt: metrics.readingTime,
      })
    )
    .digest("hex")
    .slice(0, 16);
  return `${contentHash}:${metricsHash}`;
}

/**
 * Upstash returns a stored JSON string already parsed, so a hit is usually an
 * object. Anything that isn't a valid result counts as a miss.
 */
function readCached(cached: unknown): Suggestions | null {
  if (!cached) {
    return null;
  }
  let value: unknown = cached;
  if (typeof cached === "string") {
    try {
      value = JSON.parse(cached);
    } catch {
      return null;
    }
  }
  const parsed = aiReadabilityResponseSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

/**
 * The same limiter, key names and window the CMS route used (20 requests per
 * minute, once per user and once per client IP, per workspace).
 */
async function enforceRateLimit(
  redis: Redis,
  workspaceId: string,
  userId: string,
  clientIp: string | null
) {
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, "60 s"),
    ephemeralCache: new Map(),
    prefix: "ai-suggestions-rate-limit",
  });
  const [userLimit, ipLimit] = await Promise.all([
    limiter.limit(`${workspaceId}:${userId}`),
    limiter.limit(`${workspaceId}:ip:${clientIp ?? "unknown"}`),
  ]);
  if (!(userLimit.success && ipLimit.success)) {
    const hit = userLimit.success ? ipLimit : userLimit;
    throw new ReadabilityError(429, "Too Many Requests", {
      limit: hit.limit,
      remaining: hit.remaining,
      reset: hit.reset,
    });
  }
}

/**
 * Readability suggestions for the editor. A model failure is not an error: it
 * returns no suggestions with `unavailable: true`, so the editor can tell an
 * outage from "nothing to suggest".
 */
export async function suggestReadability(
  ctx: ServiceContext,
  args: z.infer<typeof aiReadabilityBodySchema> & {
    workspaceId: string;
    userId: string;
    clientIp: string | null;
    bypassCache?: boolean;
  }
): Promise<Suggestions & { unavailable: boolean }> {
  const { workspaceId, userId, clientIp, content, metrics, postId } = args;

  const plan = await getWorkspacePlan(ctx, workspaceId);
  if (!canPerformAction(plan, "advancedReadability")) {
    throw new ReadabilityError(
      403,
      "Upgrade to Hobby to use AI readability insights"
    );
  }

  if (postId) {
    const foundPost = await ctx.db.query.post.findFirst({
      where: and(eq(post.id, postId), eq(post.workspaceId, workspaceId)),
      columns: { id: true },
    });
    if (!foundPost) {
      throw new ReadabilityError(
        404,
        "Post not found or does not belong to this workspace"
      );
    }
  }

  const redis = new Redis({
    url: ctx.env.REDIS_URL,
    token: ctx.env.REDIS_TOKEN,
  });
  const cacheKey = postId
    ? `ai:suggestions:${workspaceId}:${postId}`
    : `ai:suggestions:${workspaceId}:${createContentHash(content, metrics)}`;

  if (!args.bypassCache) {
    const cached = readCached(await redis.get(cacheKey));
    if (cached) {
      ctx.log.set({ readability: { cache: "hit" } });
      return { ...cached, unavailable: false };
    }
  }
  ctx.log.set({
    readability: { cache: args.bypassCache ? "bypass" : "miss" },
  });

  await enforceRateLimit(redis, workspaceId, userId, clientIp);

  const modelContent = htmlToMarkdown(content).slice(
    0,
    MAX_AI_READABILITY_MODEL_CONTENT_LENGTH
  );

  let result: Suggestions;
  try {
    const { model, telemetry } = createModel(ctx);
    const generated = await generateText({
      model,
      telemetry,
      timeout: 30_000,
      system: systemPrompt({ metrics }),
      prompt: `
        <CONTENT>
        ${modelContent}
        </CONTENT>
      `,
      output: Output.object({ schema: aiReadabilityResponseSchema }),
    });
    result = generated.output;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown AI Gateway error";
    ctx.log.warn(`AI readability suggestions unavailable: ${message}`);
    return { suggestions: [], unavailable: true };
  }

  await redis.set(cacheKey, JSON.stringify(result), {
    ex: CACHE_TTL_SECONDS,
  });
  return { ...result, unavailable: false };
}
