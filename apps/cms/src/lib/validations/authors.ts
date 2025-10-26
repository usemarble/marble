import { z } from "zod";
import { SOCIAL_PLATFORMS, type SocialPlatform } from "@/lib/constants";

const socialLinkSchema = z.object({
  id: z.string().optional().nullable(),
  url: z
    .string()
    .min(1, { message: "URL cannot be empty" })
    .transform((value) => {
      // Auto-prepend https:// if no scheme is provided
      return /^(https?:)?\/\//i.test(value) ? value : `https://${value}`;
    })
    .refine(
      (value) => {
        try {
          const url = new URL(value);
          return url.protocol === "https:" || url.protocol === "http:";
        } catch {
          return false;
        }
      },
      {
        message: "Please enter a valid URL",
      }
    )
    .refine(
      (value) => {
        try {
          const url = new URL(value);
          return url.hostname.includes(".");
        } catch {
          return false;
        }
      },
      {
        message: "Please enter a valid domain (e.g., example.com)",
      }
    ),
  platform: z.enum(
    Object.keys(SOCIAL_PLATFORMS) as [SocialPlatform, ...SocialPlatform[]]
  ),
});

// Author Schema
export const authorSchema = z.object({
  name: z.string().trim().min(1, { message: "Name cannot be empty" }),
  role: z
    .string()
    .trim()
    .transform((v) => (v === "" ? undefined : v))
    .optional(),
  bio: z
    .string()
    .trim()
    .transform((v) => (v === "" ? undefined : v))
    .optional(),
  image: z.string().nullable().optional(),
  userId: z.string().nullable().optional(),
  email: z
    .string()
    .email({ message: "Please enter a valid email address" })
    .optional()
    .or(z.literal("")),
  slug: z
    .string()
    .min(4, { message: "Slug cannot be empty" })
    .max(32, { message: "Slug cannot be more than 32 characters" })
    .regex(/^[a-z0-9]+([a-z0-9-]*[a-z0-9])?$/, {
      message:
        "Slug must start and end with letters or digits, and only contain lowercase letters, digits, and hyphens",
    }),
  socials: z.array(socialLinkSchema).optional(),
});
export type CreateAuthorValues = z.infer<typeof authorSchema>;
export type SocialLink = z.infer<typeof socialLinkSchema>;
