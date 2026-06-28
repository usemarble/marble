import { z } from "zod";

export const MAX_AI_READABILITY_CONTENT_LENGTH = 20_000;
export const MAX_AI_READABILITY_MODEL_CONTENT_LENGTH = 12_000;

const readabilityMetricsSchema = z.object({
  wordCount: z.number().int().min(0).max(100_000),
  sentenceCount: z.number().int().min(0).max(100_000),
  wordsPerSentence: z.number().min(0).max(10_000),
  readabilityScore: z.number().min(0).max(100),
  readingTime: z.number().min(0).max(10_000),
});

export const aiReadabilityBodySchema = z.object({
  content: z.string().trim().min(1).max(MAX_AI_READABILITY_CONTENT_LENGTH),
  metrics: readabilityMetricsSchema,
  postId: z.string().optional(),
});

export const aiReadabilityResponseSchema = z.object({
  suggestions: z
    .array(
      z.object({
        text: z
          .string()
          .max(280)
          .describe("The main suggestion text (1-2 sentences)"),
        explanation: z
          .string()
          .max(180)
          .optional()
          .describe("Brief explanation or example (optional, 1 sentence max)"),
        textReference: z
          .string()
          .max(160)
          .optional()
          .describe("Specific text snippet to highlight (optional)"),
      })
    )
    .describe(
      "Array of specific, actionable readability improvement suggestions"
    )
    .max(8),
});
