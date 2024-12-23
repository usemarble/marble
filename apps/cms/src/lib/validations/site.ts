import { z } from "zod";

export const siteSchema = z.object({
  name: z.string().min(1, { message: "Name cannot be empty" }),
  description: z.string().optional(),
});
export type CreateSiteValues = z.infer<typeof siteSchema>;

export const workspaceSchema = z.object({
  name: z.string().min(1, { message: "Name cannot be empty" }),
  slug: z.string().min(4, { message: "Slug cannot be empty" }),
  description: z.string().optional(),
});
export type CreateWorkspaceValues = z.infer<typeof workspaceSchema>;
