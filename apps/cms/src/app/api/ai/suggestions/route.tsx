import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { aiSuggestionsRateLimiter, rateLimitHeaders } from "@/lib/ratelimit";

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
      { error: "Too many requests", remaining },
      { status: 429, headers: rateLimitHeaders(limit, remaining, reset) }
    );
  }

  const { content } = await request.json();

  if (!content) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  const { createOpenRouter } = await import("@openrouter/ai-sdk-provider");
  const { streamObject } = await import("ai");
  const { z } = await import("zod");

  const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
  });

  const systemPrompt = (content: string) => {
    return `
  You are a helpful assistant that generates suggestions for content.
  You will be given a piece of content and you will need to generate suggestions for it.
  You will need to generate 10 suggestions for the content.
  The current content of the post is: ${content}
  `;
  };

  const result = streamObject({
    model: openrouter.chat("google/gemini-2.5-flash-lite"),
    prompt: systemPrompt(content),
    schema: z.array(z.string()),
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
