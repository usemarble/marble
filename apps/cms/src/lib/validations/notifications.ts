import { z } from "zod";

export const notificationPreferencePatchSchema = z.discriminatedUnion("scope", [
  z.object({
    scope: z.literal("user"),
    key: z.enum(["marketing", "product"]),
    value: z.boolean(),
  }),
  z.object({
    scope: z.literal("workspace"),
    key: z.enum(["usageAlerts", "subscriptions"]),
    value: z.boolean(),
  }),
]);

export type NotificationPreferencePatch = z.infer<
  typeof notificationPreferencePatchSchema
>;
