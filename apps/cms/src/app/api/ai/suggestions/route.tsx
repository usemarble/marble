import { createHash } from "node:crypto";
import { db } from "@marble/db";
import { post } from "@marble/db/schema";
import { htmlToMarkdown } from "@marble/parser";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireActiveWorkspaceAccess } from "@/lib/auth/access";
import { canPerformAction } from "@/lib/plans";
import { aiSuggestionsRateLimiter, rateLimitHeaders } from "@/lib/ratelimit";
import { redis } from "@/lib/redis";
import { getWorkspacePlanType } from "@/lib/subscription/access";
import {
  aiReadabilityBodySchema,
  aiReadabilityResponseSchema,
  MAX_AI_READABILITY_MODEL_CONTENT_LENGTH,
} from "@/lib/validations/editor";
import { systemPrompt } from "./prompt";

export const maxDuration = 30;

function createContentHash(
  content: string,
  metrics: {
    wordCount: number;
    sentenceCount: number;
    wordsPerSentence: number;
    readabilityScore: number;
    readingTime: number;
  }
): string {
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

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const forwardedIp = forwardedFor?.split(",").at(0)?.trim();
  return (
    forwardedIp ||
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(request: Request) {
  const accessData = await requireActiveWorkspaceAccess();

  if (!accessData.ok) {
    return accessData.response;
  }

  const { sessionData, workspaceId } = accessData;

  const plan = await getWorkspacePlanType(workspaceId);
  if (!canPerformAction(plan, "advancedReadability")) {
    return NextResponse.json(
      { error: "Upgrade to Hobby to use AI readability insights" },
      { status: 403 }
    );
  }

  const bypassCache = request.headers.get("x-bypass-cache") === "true";

  const body = await request.json();
  const parsedBody = aiReadabilityBodySchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsedBody.error.issues },
      { status: 400 }
    );
  }

  const postId = parsedBody.data.postId;

  if (postId) {
    const foundPost = await db.query.post.findFirst({
      where: and(eq(post.id, postId), eq(post.workspaceId, workspaceId)),
      columns: {
        id: true,
      },
    });

    if (!foundPost) {
      return NextResponse.json(
        { error: "Post not found or does not belong to this workspace" },
        { status: 404 }
      );
    }
  }

  const cacheKey = postId
    ? `ai:suggestions:${workspaceId}:${postId}`
    : `ai:suggestions:${workspaceId}:${createContentHash(parsedBody.data.content, parsedBody.data.metrics)}`;

  if (!bypassCache) {
    const cached = await redis.get<string>(cacheKey);
    if (cached) {
      const cachedJson =
        typeof cached === "string" ? cached : JSON.stringify(cached);
      return new NextResponse(cachedJson, {
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  const userRateLimitKey = `${workspaceId}:${sessionData.user.id}`;
  const ipRateLimitKey = `${workspaceId}:ip:${getClientIp(request)}`;
  const [userRateLimit, ipRateLimit] = await Promise.all([
    aiSuggestionsRateLimiter.limit(userRateLimitKey),
    aiSuggestionsRateLimiter.limit(ipRateLimitKey),
  ]);

  const rateLimit = userRateLimit.success ? ipRateLimit : userRateLimit;

  if (!(userRateLimit.success && ipRateLimit.success)) {
    return NextResponse.json(
      { error: "Too Many Requests", remaining: rateLimit.remaining },
      {
        status: 429,
        headers: rateLimitHeaders(
          rateLimit.limit,
          rateLimit.remaining,
          rateLimit.reset
        ),
      }
    );
  }

  const { generateObject } = await import("ai");
  const modelContent = htmlToMarkdown(parsedBody.data.content).slice(
    0,
    MAX_AI_READABILITY_MODEL_CONTENT_LENGTH
  );

  let resultJson: string;

  try {
    const result = await generateObject({
      model: "openai/gpt-5-mini",
      system: systemPrompt({ metrics: parsedBody.data.metrics }),
      prompt: `
        <CONTENT>
        ${modelContent}
        </CONTENT>
      `,
      schema: aiReadabilityResponseSchema,
    });

    resultJson = JSON.stringify(result.object);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown AI Gateway error";
    console.warn(`AI readability suggestions unavailable: ${message}`);

    return NextResponse.json(
      { suggestions: [] },
      {
        headers: {
          "Cache-Control": "no-store",
          "X-Marble-AI-Status": "unavailable",
        },
      }
    );
  }

  await redis.set(cacheKey, resultJson, { ex: 1200 });

  return new NextResponse(resultJson, {
    headers: { "Content-Type": "application/json" },
  });
}
