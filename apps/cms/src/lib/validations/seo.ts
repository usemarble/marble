import { z } from "zod";

export const knowledgeWebsiteSchema = z.object({
  websiteUrl: z
    .string()
    .trim()
    .url({ message: "Please enter a valid URL" }),
  additionalUrls: z
    .array(z.string().trim().url({ message: "Please enter a valid URL" }))
    .optional()
    .default([]),
});

export type KnowledgeWebsiteValues = z.infer<
  typeof knowledgeWebsiteSchema
>;

export const knowledgeResponseSchema = z.object({
  tone: z
    .enum([
      "Professional",
      "Humorous",
      "Academic",
      "Persuasive",
      "Conversational",
      "Technical",
    ])
    .describe("The communication tone that best matches the company's style"),
  companyDescription: z
    .string()
    .describe("A concise overview of the company (1-5 sentences)"),
  audience: z
    .string()
    .describe("A description of the core audience the company is targeting (1-2 sentences)"),
});

export type KnowledgeResponseValues = z.infer<
  typeof knowledgeResponseSchema
>;





