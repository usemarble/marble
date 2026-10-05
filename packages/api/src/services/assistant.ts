import type { Session } from "@marble/auth";
import { workspace } from "@marble/db/schema";
import { canPerformAction } from "@marble/utils";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { eq } from "drizzle-orm";
import type { ServiceContext } from "../context";
import { getMembership, getWorkspacePlan } from "./access";

export class AssistantError extends Error {
  readonly status: 401 | 403 | 429;
  /** Seconds until the caller may try again; set on 429. */
  readonly retryAfterSeconds?: number;

  constructor(
    status: 401 | 403 | 429,
    message: string,
    retryAfterSeconds?: number
  ) {
    super(message);
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/** Per user, across workspaces: a burst limit and a daily cap. */
const MINUTE_LIMIT = 10;
const DAILY_LIMIT = 100;

/** Guard 1: the caller has a verified session. */
export function requireVerifiedSession(session: Session | null) {
  if (!session?.user.emailVerified) {
    throw new AssistantError(401, "Sign in to use the assistant");
  }
  return session;
}

async function enforceRateLimits(redis: Redis, userId: string) {
  const perMinute = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(MINUTE_LIMIT, "60 s"),
    ephemeralCache: new Map(),
    prefix: "ai-assistant-minute-rate-limit",
  });
  const perDay = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(DAILY_LIMIT, "24 h"),
    ephemeralCache: new Map(),
    prefix: "ai-assistant-daily-rate-limit",
  });

  // The burst limit goes first so a rejected burst doesn't spend the day's cap.
  const checks = [
    {
      limiter: perMinute,
      message: "You're sending messages too fast. Give it a moment.",
    },
    {
      limiter: perDay,
      message:
        "You've reached today's assistant message limit. Try again tomorrow.",
    },
  ];
  for (const { limiter, message } of checks) {
    const result = await limiter.limit(userId);
    if (!result.success) {
      const retryAfter = Math.max(
        1,
        Math.ceil((result.reset - Date.now()) / 1000)
      );
      throw new AssistantError(429, message, retryAfter);
    }
  }
}

/**
 * Guards 2 to 4, in order, before any model call: the caller is a member of the
 * workspace (403), the workspace's plan includes the assistant (403), and the
 * caller is under their per-minute and daily limits (429). Returns what the
 * chat needs about the workspace.
 */
export async function authorizeChat(
  ctx: ServiceContext,
  userId: string,
  workspaceId: string
) {
  const membership = await getMembership(ctx, workspaceId, userId);
  if (!membership) {
    throw new AssistantError(403, "You do not have access to this workspace");
  }

  const plan = await getWorkspacePlan(ctx, workspaceId);
  if (!canPerformAction(plan, "aiAssistant")) {
    throw new AssistantError(403, "Upgrade to Hobby to use the AI assistant");
  }

  await enforceRateLimits(
    new Redis({ url: ctx.env.REDIS_URL, token: ctx.env.REDIS_TOKEN }),
    userId
  );

  const found = await ctx.db.query.workspace.findFirst({
    where: eq(workspace.id, workspaceId),
    columns: { name: true },
  });
  return { workspaceName: found?.name ?? "" };
}
