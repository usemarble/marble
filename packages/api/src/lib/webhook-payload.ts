import type { buildWebhookPayload } from "@marble/events";

type WebhookPayload = ReturnType<typeof buildWebhookPayload>;
type PayloadFormat = "json" | "discord" | "slack";
type WebhookData = Record<string, unknown>;

interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

const MARBLE_COLOR = 5_786_879;
const MARBLE_AVATAR_URL = "https://marblecms.com/logo.svg";

function formatEvent(input: string) {
  return (
    input.replace(/\./g, " ").replace(/\b\w/g, (char) => char.toUpperCase()) +
    "!"
  );
}

function getData(payload: WebhookPayload): WebhookData {
  return payload.data &&
    typeof payload.data === "object" &&
    !Array.isArray(payload.data)
    ? (payload.data as WebhookData)
    : {};
}

function stringify(value: unknown) {
  if (value === null || value === undefined) {
    return "None";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function getDisplayFields(payload: WebhookPayload) {
  const data = getData(payload);
  const fields: DiscordEmbedField[] = [
    { name: "Event ID", value: payload.id },
    { name: "Workspace ID", value: payload.workspaceId },
  ];

  if ("id" in data) {
    fields.splice(1, 0, { name: "Resource ID", value: stringify(data.id) });
  }

  if ("slug" in data) {
    fields.push({ name: "Slug", value: stringify(data.slug) });
  } else if ("name" in data) {
    fields.push({ name: "Name", value: stringify(data.name) });
  }

  if (payload.actor?.id) {
    fields.push({
      name: "Actor",
      value: `${payload.actor.type} (${payload.actor.id})`,
    });
  }

  return fields;
}

function buildDiscordWebhookBody(payload: WebhookPayload) {
  const data = getData(payload);
  const formattedEvent = formatEvent(payload.type);

  return {
    content: "title" in data ? stringify(data.title) : undefined,
    username: "Marble",
    avatar_url: MARBLE_AVATAR_URL,
    embeds: [
      {
        title: formattedEvent,
        description: payload.type,
        color: MARBLE_COLOR,
        author: {
          name: "Marble",
          icon_url: MARBLE_AVATAR_URL,
        },
        fields: getDisplayFields(payload),
        footer: {
          text: "Powered by marblecms.com",
        },
      },
    ],
    allowed_mentions: { parse: [] },
  };
}

function buildSlackWebhookBody(payload: WebhookPayload) {
  const data = getData(payload);
  const formattedEvent = formatEvent(payload.type);
  const fields = getDisplayFields(payload).map(
    (field) => `*${field.name}:* ${field.value}`
  );

  return {
    text: "title" in data ? stringify(data.title) : formattedEvent,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: formattedEvent,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: fields.join("\n"),
        },
        accessory: {
          type: "image",
          image_url: MARBLE_AVATAR_URL,
          alt_text: "Marble",
        },
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: "Powered by marblecms.com",
          },
        ],
      },
    ],
  };
}

export function buildWebhookRequestBody(
  payload: WebhookPayload,
  format: PayloadFormat
) {
  switch (format) {
    case "discord":
      return buildDiscordWebhookBody(payload);
    case "slack":
      return buildSlackWebhookBody(payload);
    default:
      return payload;
  }
}
