import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { NodeHtmlMarkdown } from "node-html-markdown";
import { getServerSession } from "@/lib/auth/session";
import { openrouter } from "@/lib/openrouter";
import { aiSuggestionsRateLimiter, rateLimitHeaders } from "@/lib/ratelimit";
import {
  aiReadabilityBodySchema,
  aiReadabilityResponseSchema,
} from "@/lib/validations/editor";
import { systemPrompt } from "./prompt";

export const maxDuration = 30;

export async function POST(request: Request) {
  const sessionData = await getServerSession();

  if (!sessionData || !sessionData.session.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { success, limit, remaining, reset } =
    await aiSuggestionsRateLimiter.limit(
      sessionData.session.activeOrganizationId
    );

  if (!success) {
    return NextResponse.json(
      { error: "Too Many Requests", remaining },
      { status: 429, headers: rateLimitHeaders(limit, remaining, reset) }
    );
  }

  const workspace = await db.organization.findUnique({
    where: { id: sessionData.session.activeOrganizationId },
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

  const { streamObject } = await import("ai");

  const result = streamObject({
    model: openrouter.chat("google/gemini-2.5-flash"),
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
    providerOptions: {
      google: {
        safetySettings: [
          {
            category: "HARM_CATEGORY_UNSPECIFIED",
            threshold: "BLOCK_LOW_AND_ABOVE",
          },
        ],
      },
    },
  });

  return result.toTextStreamResponse();
}
