import { FatalError } from "workflow";
import { firecrawl } from "@/lib/firecrawl";
import {
  addWorkflowLog,
  clearWorkflowState,
  updateWorkflowStep,
} from "@/lib/workflows/brand-knowledge-state";

export type BrandKnowledgeResult = {
  companyDescription: string;
  tone: string;
  audience: string;
};

export type BrandKnowledgeWorkflowInput = {
  workspaceId: string;
  websiteUrl: string;
  additionalUrls?: string[];
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

async function scrapeMainPage(websiteUrl: string, workspaceId: string) {
  "use step";

  await updateWorkflowStep(workspaceId, "scraping");
  await addWorkflowLog(workspaceId, `Scraping main page: ${websiteUrl}`);

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
      `Main page scraped (${scrape.markdown.length} chars)`
    );
    return scrape.markdown;
  } catch (error) {
    const errorMessage = extractErrorMessage(error);
    await addWorkflowLog(
      workspaceId,
      `Scrape failed: ${errorMessage}`,
      "error"
    );
    await updateWorkflowStep(workspaceId, "error", errorMessage);
    throw new FatalError(errorMessage);
  }
}

async function crawlAdditionalPages(
  websiteUrl: string,
  workspaceId: string,
  additionalUrls?: string[]
) {
  "use step";

  await updateWorkflowStep(workspaceId, "crawling");

  if (!additionalUrls?.length) {
    await addWorkflowLog(
      workspaceId,
      "No additional pages to crawl, using discovery crawl"
    );

    try {
      const crawlResult = await firecrawl.crawl(websiteUrl, {
        limit: 5,
        scrapeOptions: {
          formats: ["markdown"],
        },
        includePaths: ["about*", "pricing*", "team*", "services*", "product*"],
      });

      if (crawlResult.data && crawlResult.data.length > 0) {
        const additionalContent = crawlResult.data
          .filter((page) => page.markdown && page.markdown.length > 100)
          .map((page) => page.markdown)
          .join("\n\n---\n\n");

        await addWorkflowLog(
          workspaceId,
          `Crawled ${crawlResult.data.length} additional pages`
        );
        return additionalContent;
      }

      await addWorkflowLog(workspaceId, "No additional pages found");
      return "";
    } catch (error) {
      await addWorkflowLog(
        workspaceId,
        `Crawl failed (non-fatal): ${extractErrorMessage(error)}`,
        "warn"
      );
      return "";
    }
  }

  await addWorkflowLog(
    workspaceId,
    `Crawling ${additionalUrls.length} additional URLs`
  );

  const additionalContent: string[] = [];

  for (const url of additionalUrls) {
    try {
      await addWorkflowLog(workspaceId, `Scraping: ${url}`);
      const scrape = await firecrawl.scrape(url, {
        formats: ["markdown"],
      });

      if (scrape.markdown && scrape.markdown.length > 100) {
        additionalContent.push(scrape.markdown);
        await addWorkflowLog(
          workspaceId,
          `Scraped ${url} (${scrape.markdown.length} chars)`
        );
      }
    } catch (error) {
      await addWorkflowLog(
        workspaceId,
        `Failed to scrape ${url}: ${extractErrorMessage(error)}`,
        "warn"
      );
    }
  }

  return additionalContent.join("\n\n---\n\n");
}

async function validateContent(
  mainContent: string,
  additionalContent: string,
  workspaceId: string
) {
  "use step";

  await addWorkflowLog(workspaceId, "Validating scraped content...");

  const combinedContent = [mainContent, additionalContent]
    .filter(Boolean)
    .join("\n\n---\n\n");

  if (!combinedContent || combinedContent.length < 100) {
    const errorMsg = "Website content is too short or empty to analyze";
    await addWorkflowLog(workspaceId, errorMsg, "error");
    await updateWorkflowStep(workspaceId, "error", errorMsg);
    throw new FatalError(errorMsg);
  }

  const cleanedContent = combinedContent
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
    `Content validated (${cleanedContent.length} chars total)`
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

  const prompt = `Analyze the following website content from ${websiteUrl} and generate a comprehensive brand knowledge summary.

<CONTENT>
${content.slice(0, 20_000)}
</CONTENT>

<TASK>
Based on the website content above, extract and synthesize the following brand information:

1. **Company Description**: Write a compelling 2-4 sentence description that includes:
   - What the company does and their core offerings
   - Their unique value proposition or what sets them apart
   - Key achievements, notable clients, or trust signals (if mentioned)
   - The overall brand personality and positioning
   
2. **Tone Profile**: Select the communication tone that best matches the brand's voice:
   - Professional: Formal, expert, authoritative
   - Humorous: Playful, witty, entertaining
   - Academic: Scholarly, research-focused, educational
   - Persuasive: Sales-oriented, benefit-focused, compelling
   - Conversational: Friendly, approachable, relatable
   - Technical: Detailed, specification-focused, precise

3. **Target Audience**: Write a 1-2 sentence description of who the company serves, including:
   - Primary customer segments or user personas
   - Key needs or problems the audience has
   - How the company positions itself to serve them

IMPORTANT: Only include information actually present in the content. Do not fabricate or assume details not found in the source material. If certain information is not available, provide your best inference based on context clues.
</TASK>`;

  const { z } = await import("zod");

  try {
    const result = await generateObject({
      model: "anthropic/claude-4-5-haiku",
      schema: z.object({
        companyDescription: z
          .string()
          .describe("A compelling 2-4 sentence company description"),
        tone: z.enum([
          "Professional",
          "Humorous",
          "Academic",
          "Persuasive",
          "Conversational",
          "Technical",
        ]),
        audience: z
          .string()
          .describe("1-2 sentence target audience description"),
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

  const { workspaceId, websiteUrl, additionalUrls } = input;

  const mainContent = await scrapeMainPage(websiteUrl, workspaceId);
  const additionalContent = await crawlAdditionalPages(
    websiteUrl,
    workspaceId,
    additionalUrls
  );
  const validatedContent = await validateContent(
    mainContent,
    additionalContent,
    workspaceId
  );
  const result = await summarizeContent(
    validatedContent,
    websiteUrl,
    workspaceId
  );
  await saveToDatabase(workspaceId, websiteUrl, result);

  return result;
}
