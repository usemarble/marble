import { z } from "zod";

export const siteSchema = z.object({
  name: z.string({ message: "Name cannot be empty" }).min(1),
  description: z.string().optional(),
});
export type CreateSiteValues = z.infer<typeof siteSchema>;

export const workspaceSchema = z.object({
  name: z.string({ message: "Name cannot be empty" }).min(1),
  slug: z.string({ message: "Slug cannot be empty" }).min(4),
  description: z.string().optional(),
});
export type CreateWorkspaceValues = z.infer<typeof workspaceSchema>;
