import { z } from "zod";
import { qstash } from "./qstash";
import { createHmac, timingSafeEqual } from "crypto";
import { WebhookVerificationError } from "./webhook-errors";

const eventSchema = z.object({
  "post.published": z.object({}),
  "post.updated": z.object({}),
  "post.deleted": z.object({}),
  "category.created": z.object({}),
  "category.updated": z.object({}),
  "category.deleted": z.object({}),
  "tag.created": z.object({}),
  "tag.updated": z.object({}),
  "tag.deleted": z.object({}),
  "media.uploaded": z.object({}),
  "media.deleted": z.object({}),
});

type WebhookEvent = z.infer<typeof eventSchema>;

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
  }) {
    const { url, event, data } = args;

    const body = { event, data };
    const payload = JSON.stringify(body);

    const signature = this.sign(payload);

    await qstash.publishJSON({
      url,
      body,
      headers: {
        "x-marble-signature": `sha256=${signature}`,
      },
    });
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

/**
 * EXAMPLE USAGE
 * 
 * --- 
 * sending a webhook
 * 
 * const webhook = new WebhookClient({ secret: "my-secret" });

  await webhook.send({
    url: "https://sponge-relaxing-separately.ngrok-free.app/api/webhooks/test",
    event: "post.published",
    data: { my: "data" },
  });

  * --- 
  * receiving a webhook
  * 
  * const webhook = new WebhookClient({ secret: "my-secret" });

    const body = await req.text();
    const signature = req.headers.get("x-marble-signature");

    const { event, data } = await webhook.verify({
        body,
        signature,
    });

    if (event === "post.published") {
        console.log(data);
    }
 */
