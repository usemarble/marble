import { type NextRequest, NextResponse } from "next/server";
import { scrapeWebsiteTool } from "@/lib/ai/tools/scrape-website";
import { getServerSession } from "@/lib/auth/session";
import {
  brandKnowledgeResponseSchema,
  brandKnowledgeWebsiteSchema,
} from "@/lib/validations/seo";
import { brandKnowledgePrompt } from "./prompt";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const sessionData = await getServerSession();

  if (!sessionData || !sessionData.session.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsedBody = brandKnowledgeWebsiteSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsedBody.error.issues },
      { status: 400 }
    );
  }

  const { websiteUrl } = parsedBody.data;
  const { streamText, stepCountIs, Output } = await import("ai");

  const result = streamText({
    model: "anthropic/claude-4-5-haiku",
    tools: {
      scrapeWebsite: scrapeWebsiteTool,
    },
    experimental_output: Output.object({
      schema: brandKnowledgeResponseSchema,
    }),
    prepareStep: async ({ stepNumber }: { stepNumber: number }) => {
      if (stepNumber === 0) {
        return {
          toolChoice: { type: "tool", toolName: "scrapeWebsite" },
          activeTools: ["scrapeWebsite"],
        };
      }
      return {};
    },
    prompt: brandKnowledgePrompt({ websiteUrl }),
    stopWhen: stepCountIs(6),
  });

  for await (const textPart of result.textStream) {
    console.log(textPart);
  }

  return result.toTextStreamResponse();
}
