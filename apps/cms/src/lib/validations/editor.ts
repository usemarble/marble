import { z } from "zod";

export const editorPreferenceSchema = z.object({
  ai: z.object({
    enabled: z.boolean(),
  }),
});

export const aiReadabilityBodySchema = z.object({
  content: z.string(),
  metrics: z.object({
    wordCount: z.number(),
    sentenceCount: z.number(),
    wordsPerSentence: z.number(),
    readabilityScore: z.number(),
    readingTime: z.number(),
  }),
});

export const aiReadabilityResponseSchema = z.object({
  suggestions: z
    .array(
      z.object({
        text: z.string().describe("The main suggestion text (1-2 sentences)"),
        explanation: z
          .string()
          .optional()
          .describe("Brief explanation or example (optional, 1 sentence max)"),
        textReference: z
          .string()
          .optional()
          .describe("Specific text snippet to highlight (optional)"),
      })
    )
    .describe(
      "Array of specific, actionable readability improvement suggestions"
    )
    .max(8),
});

export type EditorPreferenceValues = z.infer<typeof editorPreferenceSchema>;
