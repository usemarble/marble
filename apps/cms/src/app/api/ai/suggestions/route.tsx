import { createHash } from "node:crypto";
import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { NodeHtmlMarkdown } from "node-html-markdown";
import { getServerSession } from "@/lib/auth/session";
import { aiSuggestionsRateLimiter, rateLimitHeaders } from "@/lib/ratelimit";
import { redis } from "@/lib/redis";
import {
  aiReadabilityBodySchema,
  aiReadabilityResponseSchema,
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

export async function POST(request: Request) {
  const sessionData = await getServerSession();

  if (!sessionData || !sessionData.session.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = sessionData.session.activeOrganizationId;

  const bypassCache = request.headers.get("x-bypass-cache") === "true";

  const workspace = await db.organization.findUnique({
    where: { id: workspaceId },
    select: {
      editorPreferences: {
        select: {
          ai: { select: { enabled: true } },
        },
      },
    },
  });

  if (!workspace?.editorPreferences?.ai?.enabled) {
    return NextResponse.json({ error: "AI is not enabled" }, { status: 400 });
  }

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

  const { success, limit, remaining, reset } =
    await aiSuggestionsRateLimiter.limit(workspaceId);

  if (!success) {
    return NextResponse.json(
      { error: "Too Many Requests", remaining },
      { status: 429, headers: rateLimitHeaders(limit, remaining, reset) }
    );
  }

  const { generateObject } = await import("ai");

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
        ${NodeHtmlMarkdown.translate(parsedBody.data.content)}
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
