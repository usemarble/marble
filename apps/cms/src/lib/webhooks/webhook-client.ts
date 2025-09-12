import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "@marble/db";
import { z } from "zod";
import type { Session } from "../auth/types";
import type {
  PayloadFormat,
  WebhookEvent as WebhookValidationEvent,
} from "../validations/webhook";
import {
  handleWebhookDiscord,
  handleWebhookJSON,
  handleWebhookSlack,
} from "./util";
import { WebhookVerificationError } from "./webhook-errors";

const eventSchema = z.object({
  "post.published": z.object({
    id: z.string(),
    title: z.string(),
    slug: z.string(),
    userId: z.string(),
  }),
  "post.updated": z.object({
    id: z.string(),
    title: z.string(),
    slug: z.string(),
    userId: z.string(),
  }),
  "post.deleted": z.object({
    id: z.string(),
    slug: z.string(),
    userId: z.string(),
  }),
  "category.created": z.object({
    id: z.string(),
    slug: z.string(),
    userId: z.string(),
  }),
  "category.updated": z.object({
    id: z.string(),
    slug: z.string(),
    userId: z.string(),
  }),
  "category.deleted": z.object({
    id: z.string(),
    slug: z.string(),
    userId: z.string(),
  }),
  "tag.created": z.object({
    id: z.string(),
    slug: z.string(),
    userId: z.string(),
  }),
  "tag.updated": z.object({
    id: z.string(),
    slug: z.string(),
    userId: z.string(),
  }),
  "tag.deleted": z.object({
    id: z.string(),
    slug: z.string(),
    userId: z.string(),
  }),
  "media.uploaded": z.object({
    id: z.string(),
    name: z.string(),
    userId: z.string(),
  }),
  "media.deleted": z.object({
    id: z.string(),
    name: z.string(),
    userId: z.string(),
  }),
});

type WebhookEvent = z.infer<typeof eventSchema>;
export type WebhookBody = {
  event: keyof WebhookEvent;
  data: WebhookEvent[keyof WebhookEvent];
};

export class WebhookClient {
  private secret: string;

  constructor({ secret }: { secret: string }) {
    this.secret = secret;
  }

  private sign(payload: string): string {
    return createHmac("sha256", this.secret).update(payload).digest("hex");
  }

  private getSignature(signatureHeader: string) {
    const match = signatureHeader.match(/^sha256=(.+)$/);

    if (!match) {
      throw new WebhookVerificationError("Invalid signature format");
    }

    return match[1] ?? "";
  }

  private verifySignature(expected: string, computed: string): boolean {
    const expectedBuffer = Buffer.from(expected, "hex");
    const computedBuffer = Buffer.from(computed, "hex");

    if (expectedBuffer.length !== computedBuffer.length) {
      return false;
    }

    return timingSafeEqual(expectedBuffer, computedBuffer);
  }

  async send<K extends keyof WebhookEvent>(args: {
    url: string;
    event: K;
    data: WebhookEvent[K];
    format: PayloadFormat;
    retries?: number;
  }) {
    const { url, event, data, retries = 3, format } = args;

    const body = { event, data };
    const payload = JSON.stringify(body);

    const signature = this.sign(payload);

    switch (format) {
      case "json":
        await handleWebhookJSON({ url, body, signature, retries });
        break;
      case "discord":
        await handleWebhookDiscord({ url, body, retries });
        break;
      case "slack":
        await handleWebhookSlack({ url, body, retries });
        break;
      default:
        throw new Error(`Unknown format: ${format}`);
    }
  }

  async verify<K extends keyof WebhookEvent>(args: {
    body: Buffer | string;
    signature: string | null | undefined;
  }) {
    const { body, signature } = args;

    if (!signature) {
      throw new WebhookVerificationError("Missing webhook signature");
    }

    const payload = typeof body === "string" ? body : body.toString("utf8");

    const expectedSignature = this.getSignature(signature);
    const computedSignature = this.sign(payload);

    if (!this.verifySignature(expectedSignature, computedSignature)) {
      throw new WebhookVerificationError("Invalid webhook signature");
    }

    try {
      const parsedPayload = JSON.parse(payload);

      if (!parsedPayload.event || !parsedPayload.data) {
        throw new WebhookVerificationError("Invalid webhook payload structure");
      }

      const eventType = parsedPayload.event as K;
      if (!(eventType in eventSchema.shape)) {
        throw new WebhookVerificationError(`Unknown event type: ${eventType}`);
      }

      return {
        event: eventType,
        data: parsedPayload.data,
      };
    } catch (err) {
      if (err instanceof WebhookVerificationError) {
        throw err;
      }

      throw new WebhookVerificationError(
        `Failed to parse webhook payload: ${JSON.stringify(err, null, 2)}`,
      );
    }
  }
}

// biome-ignore lint/suspicious/noExplicitAny: can literally be anything
type DatabaseFields = Record<string, any>;

export function getWebhooks(
  session: Session["session"],
  event: WebhookValidationEvent,
  where?: DatabaseFields,
  select?: DatabaseFields,
) {
  if (!session.activeOrganizationId) {
    throw new Error("No active organization");
  }
  return db.webhook.findMany({
    where: {
      enabled: true,
      workspaceId: session.activeOrganizationId,
      events: { has: event },
      ...where,
    },
    select: { secret: true, endpoint: true, format: true, ...select },
  });
}
