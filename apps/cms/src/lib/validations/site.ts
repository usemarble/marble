import { z } from "zod";

export const siteSchema = z.object({
  name: z.string({ required_error: "Name cannot be empty" }).min(1),
  slug: z.string({ required_error: "Slug cannot be empty" }).min(4),
  description: z.string().optional(),
});
export type CreateSiteValues = z.infer<typeof siteSchema>;
