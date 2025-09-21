import { z } from "zod";

export const editorPreferenceSchema = z.object({
  ai: z.object({
    enabled: z.boolean(),
  }),
});

export type EditorPreferenceValues = z.infer<typeof editorPreferenceSchema>;
