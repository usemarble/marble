import { FatalError } from "workflow";
import { firecrawl } from "@/lib/firecrawl";
import {
  addWorkflowLog,
  clearWorkflowState,
  updateWorkflowStep,
} from "@/lib/workflows/brand-knowledge-state";

export type BrandKnowledgeResult = {
  tone: string;
  companyDescription: string;
  audience: string;
};

export type BrandKnowledgeWorkflowInput = {
  workspaceId: string;
  websiteUrl: string;
};

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes("Insufficient credits")) {
      return "Firecrawl credits exhausted. Please try again later or contact support.";
    }
    if (error.message.includes("rate limit")) {
      return "Rate limit exceeded. Please try again in a few minutes.";
    }
    if (error.message.includes("timeout")) {
      return "Request timed out. The website may be slow or unresponsive.";
    }
    if (error.message.includes("blocked")) {
      return "Website blocked the scraping request. Try a different URL.";
    }
    return error.message;
  }
  return String(error);
}

async function crawlWebsite(websiteUrl: string, workspaceId: string) {
  "use step";

  await updateWorkflowStep(workspaceId, "crawling");
  await addWorkflowLog(workspaceId, `Starting to crawl: ${websiteUrl}`);

  try {
    const scrape = await firecrawl.scrape(websiteUrl, {
      formats: ["markdown"],
    });

    if (!scrape.markdown) {
      await addWorkflowLog(
        workspaceId,
        "Scrape returned empty content",
        "error"
      );
      throw new FatalError(
        "Failed to scrape website content - no content returned"
      );
    }

    await addWorkflowLog(
      workspaceId,
      `Successfully crawled website (${scrape.markdown.length} chars)`
    );
    return scrape.markdown;
  } catch (error) {
    const errorMessage = extractErrorMessage(error);
    await addWorkflowLog(workspaceId, `Crawl failed: ${errorMessage}`, "error");
    await updateWorkflowStep(workspaceId, "error", errorMessage);
    throw new FatalError(errorMessage);
  }
}

async function validateContent(content: string, workspaceId: string) {
  "use step";

  await updateWorkflowStep(workspaceId, "validating");
  await addWorkflowLog(workspaceId, "Validating scraped content...");

  if (!content || content.length < 100) {
    const errorMsg = "Website content is too short or empty to analyze";
    await addWorkflowLog(workspaceId, errorMsg, "error");
    await updateWorkflowStep(workspaceId, "error", errorMsg);
    throw new FatalError(errorMsg);
  }

  const cleanedContent = content
    .replace(/\[.*?\]\(.*?\)/g, "")
    .replace(/#{1,6}\s/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (cleanedContent.length < 50) {
    const errorMsg = "Website content does not contain enough text to analyze";
    await addWorkflowLog(workspaceId, errorMsg, "error");
    await updateWorkflowStep(workspaceId, "error", errorMsg);
    throw new FatalError(errorMsg);
  }

  await addWorkflowLog(
    workspaceId,
    `Content validated (${cleanedContent.length} chars after cleaning)`
  );
  return cleanedContent;
}

async function summarizeContent(
  content: string,
  websiteUrl: string,
  workspaceId: string
): Promise<BrandKnowledgeResult> {
  "use step";

  await updateWorkflowStep(workspaceId, "summarizing");
  await addWorkflowLog(workspaceId, "Starting AI analysis...");

  const { generateObject } = await import("ai");

  const prompt = `Analyze the following website content from ${websiteUrl} and generate a structured brand knowledge summary.

<CONTENT>
${content.slice(0, 15_000)}
</CONTENT>

<TASK>
Based on the website content above, provide:
1. The communication tone that best matches the company's style (choose from: Professional, Humorous, Academic, Persuasive, Conversational, Technical)
2. A concise company description (1-5 sentences) including what they do, key offerings, and unique value proposition
3. A description of their target audience (1-2 sentences)

Only include information actually found in the content. Do not fabricate details.
</TASK>`;

  const { z } = await import("zod");

  try {
    const result = await generateObject({
      model: "anthropic/claude-4-5-haiku",
      schema: z.object({
        tone: z.enum([
          "Professional",
          "Humorous",
          "Academic",
          "Persuasive",
          "Conversational",
          "Technical",
        ]),
        companyDescription: z.string(),
        audience: z.string(),
      }),
      prompt,
    });

    await addWorkflowLog(
      workspaceId,
      `AI analysis complete - Tone: ${result.object.tone}`
    );
    return result.object;
  } catch (error) {
    const errorMessage = extractErrorMessage(error);
    await addWorkflowLog(
      workspaceId,
      `AI analysis failed: ${errorMessage}`,
      "error"
    );
    await updateWorkflowStep(workspaceId, "error", errorMessage);
    throw new FatalError(errorMessage);
  }
}

async function saveToDatabase(
  workspaceId: string,
  websiteUrl: string,
  result: BrandKnowledgeResult
) {
  "use step";

  await updateWorkflowStep(workspaceId, "saving");
  await addWorkflowLog(workspaceId, "Saving results to database...");

  const { db } = await import("@marble/db");

  try {
    await db.brandKnowledge.upsert({
      where: {
        workspaceId_url: {
          workspaceId,
          url: websiteUrl,
        },
      },
      update: {
        description: {
          status: "completed",
          summary: result.companyDescription,
          tone: result.tone,
          audience: result.audience,
        },
        updatedAt: new Date(),
      },
      create: {
        workspaceId,
        url: websiteUrl,
        description: {
          status: "completed",
          summary: result.companyDescription,
          tone: result.tone,
          audience: result.audience,
        },
      },
    });

    await addWorkflowLog(workspaceId, "Brand knowledge saved successfully!");
    await updateWorkflowStep(workspaceId, "completed");
    await clearWorkflowState(workspaceId);

    return result;
  } catch (error) {
    const errorMessage = extractErrorMessage(error);
    await addWorkflowLog(
      workspaceId,
      `Database save failed: ${errorMessage}`,
      "error"
    );
    await updateWorkflowStep(workspaceId, "error", errorMessage);
    throw new FatalError(errorMessage);
  }
}

export async function brandKnowledgeWorkflow(
  input: BrandKnowledgeWorkflowInput
): Promise<BrandKnowledgeResult> {
  "use workflow";

  const { workspaceId, websiteUrl } = input;

  const rawContent = await crawlWebsite(websiteUrl, workspaceId);
  const validatedContent = await validateContent(rawContent, workspaceId);
  const result = await summarizeContent(
    validatedContent,
    websiteUrl,
    workspaceId
  );
  await saveToDatabase(workspaceId, websiteUrl, result);

  return result;
}
