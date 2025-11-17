import { z } from "zod";

export const brandKnowledgeWebsiteSchema = z.object({
  websiteUrl: z
    .string()
    .trim()
    .url({ message: "Please enter a valid URL" }),
});

export type BrandKnowledgeWebsiteValues = z.infer<
  typeof brandKnowledgeWebsiteSchema
>;





