import { db } from "@marble/db";
import { getServerSession } from "../auth/session";
import type { WebhookEvent as WebhookValidationEvent } from "../validations/webhook";
import { getDiscordEmbed, getSlackMessage } from "./embed";
import { qstash } from "./qstash";
import type { WebhookBody } from "./webhook-client";

export async function handleWebhookJSON({
  url,
  body,
  signature,
  retries,
}: {
  url: string;
  body: WebhookBody;
  signature: string;
  retries: number;
}) {
  await qstash.publishJSON({
    url,
    body,
    retries,
    headers: {
      "x-marble-signature": `sha256=${signature}`,
    },
  });
}

export async function handleWebhookDiscord({
  url,
  body,
  retries,
}: {
  url: string;
  body: WebhookBody;
  retries: number;
}) {
  const sessionData = await getServerSession();
  const username = sessionData?.user?.name;

  await qstash.publishJSON({
    url,
    body: getDiscordEmbed({
      event: body.event,
      data: body.data,
      username,
    }),
    retries,
  });
}

export async function handleWebhookSlack({
  url,
  body,
  retries,
}: {
  url: string;
  body: WebhookBody;
  retries: number;
}) {
  const sessionData = await getServerSession();
  const username = sessionData?.user?.name;

  await qstash.publishJSON({
    url,
    body: getSlackMessage({
      event: body.event,
      data: body.data,
      username,
    }),
    retries,
  });
}

// biome-ignore lint/suspicious/noExplicitAny: can literally be anything
type DatabaseFields = Record<string, any>;

export function getWebhooks(
  workspaceId: string | null,
  event: WebhookValidationEvent,
  where?: DatabaseFields,
  select?: DatabaseFields
) {
  if (!workspaceId) {
    throw new Error("No active organization");
  }
  return db.webhook.findMany({
    where: {
      enabled: true,
      workspaceId,
      events: { has: event },
      ...where,
    },
    select: { secret: true, endpoint: true, format: true, ...select },
  });
}
