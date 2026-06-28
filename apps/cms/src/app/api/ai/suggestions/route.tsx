import { createHash } from "node:crypto";
import { db } from "@marble/db";
import { htmlToMarkdown } from "@marble/parser";
import { NextResponse } from "next/server";
import { requireActiveWorkspaceAccess } from "@/lib/auth/access";
import { aiSuggestionsRateLimiter, rateLimitHeaders } from "@/lib/ratelimit";
import { redis } from "@/lib/redis";
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
    const post = await db.post.findFirst({
      where: {
        id: postId,
        workspaceId,
      },
      select: {
        id: true,
      },
    });

    if (!post) {
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

  const result = await generateObject({
    model: "openai/gpt-5.1-instant",
    messages: [
      {
        role: "system",
        content: systemPrompt({ metrics: parsedBody.data.metrics }),
      },
      {
        role: "user",
        content: `
        <CONTENT>
        ${modelContent}
        </CONTENT>
        `,
      },
    ],
    schema: aiReadabilityResponseSchema,
  });

  const resultJson = JSON.stringify(result.object);

  await redis.set(cacheKey, resultJson, { ex: 1200 });

  return new NextResponse(resultJson, {
    headers: { "Content-Type": "application/json" },
  });
}
