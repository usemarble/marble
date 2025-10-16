import { z } from "zod";
import { VALID_DISCORD_DOMAINS, VALID_SLACK_DOMAINS } from "../constants";

export const webhookEventEnum = z.enum([
  "post_published",
  "post_updated",
  "post_deleted",
  "category_created",
  "category_updated",
  "category_deleted",
  "tag_created",
  "tag_updated",
  "tag_deleted",
  //"media_uploaded",
  "media_deleted",
]);

export const payloadFormatEnum = z.enum(["json", "discord", "slack"]);

export const webhookSchema = z
  .object({
    name: z
      .string()
      .min(1, { message: "Name cannot be empty" })
      .max(50, { message: "Name cannot be more than 50 characters" }),
    endpoint: z
      .string()
      .url({ message: "Please enter a valid URL" })
      .refine(
        (raw) => {
          try {
            return new URL(raw).protocol === "https:";
          } catch {
            return false;
          }
        },
        { message: "Webhook URL must use HTTPS" }
      ),
    events: z
      .array(webhookEventEnum)
      .min(1, { message: "Please select at least one event" }),
    format: payloadFormatEnum,
  })
  .superRefine((data, ctx) => {
    const hostname = new URL(data.endpoint).hostname;

    switch (data.format) {
      case "discord":
        if (!VALID_DISCORD_DOMAINS.includes(hostname)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Discord webhook URL must be from one of: ${VALID_DISCORD_DOMAINS.join(", ")}`,
            path: ["endpoint"],
          });
        }
        break;
      case "slack":
        if (!VALID_SLACK_DOMAINS.includes(hostname)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Slack webhook URL must be from: ${VALID_SLACK_DOMAINS.join(", ")}`,
            path: ["endpoint"],
          });
        }
        break;
      default:
        break;
    }
  });

export type WebhookFormValues = z.infer<typeof webhookSchema>;

export const webhookToggleSchema = z.object({
  enabled: z.boolean(),
});

export type WebhookToggleValues = z.infer<typeof webhookToggleSchema>;

export type WebhookEvent = z.infer<typeof webhookEventEnum>;
export type PayloadFormat = z.infer<typeof payloadFormatEnum>;

export const webhookEvents: Array<{
  id: WebhookEvent;
  label: string;
  description: string;
}> = [
  {
    id: "post_published",
    label: "post.published",
    description: "When a post is published",
  },
  {
    id: "post_updated",
    label: "post.updated",
    description: "When a post is updated",
  },
  {
    id: "post_deleted",
    label: "post.deleted",
    description: "When a post is deleted",
  },
  {
    id: "category_created",
    label: "category.created",
    description: "When a category is created",
  },
  {
    id: "category_updated",
    label: "category.updated",
    description: "When a category is updated",
  },
  {
    id: "category_deleted",
    label: "category.deleted",
    description: "When a category is deleted",
  },
  {
    id: "tag_created",
    label: "tag.created",
    description: "When a tag is created",
  },
  {
    id: "tag_updated",
    label: "tag.updated",
    description: "When a tag is updated",
  },
  {
    id: "tag_deleted",
    label: "tag.deleted",
    description: "When a tag is deleted",
  },
  //{
  //  id: "media_uploaded",
  //  label: "media.uploaded",
  //  description: "When media is uploaded",
  //},
  {
    id: "media_deleted",
    label: "media.deleted",
    description: "When media is deleted",
  },
];
