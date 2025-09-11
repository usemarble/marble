import { getServerSession } from "../auth/session";
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
      username: username,
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
      username: username,
    }),
    retries,
  });
}
