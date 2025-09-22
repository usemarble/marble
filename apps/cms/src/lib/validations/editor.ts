import { z } from "zod";

export const editorPreferenceSchema = z.object({
  ai: z.object({
    enabled: z.boolean(),
  }),
});

export const aiSuggestionsSchema = z.object({
  content: z.string(),
  wordCount: z.number(),
});

export type EditorPreferenceValues = z.infer<typeof editorPreferenceSchema>;
