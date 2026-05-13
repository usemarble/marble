import type { buildWebhookPayload } from "@marble/events";

type WebhookPayload = ReturnType<typeof buildWebhookPayload>;

type PayloadFormat = "json" | "discord" | "slack";

type WebhookData = Record<string, unknown>;

interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface DiscordWebhookBody {
  content?: string;
  username: string;
  avatar_url: string;
  embeds: Array<{
    title: string;
    description: string;
    color: number;
    author: {
      name: string;
      icon_url: string;
    };
    fields: DiscordEmbedField[];
    footer: {
      text: string;
    };
  }>;
  allowed_mentions: {
    parse: string[];
  };
}

export interface SlackWebhookBody {
  text: string;
  blocks: Record<string, unknown>[];
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
  return JSON.stringify(value);
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

/**
 * Converts Marble's canonical webhook envelope into a Discord incoming webhook
 * message body.
 */
export function buildDiscordWebhookBody(
  payload: WebhookPayload
): DiscordWebhookBody {
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

/**
 * Converts Marble's canonical webhook envelope into a Slack incoming webhook
 * message body.
 */
export function buildSlackWebhookBody(
  payload: WebhookPayload
): SlackWebhookBody {
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

/**
 * Builds the exact JSON-serializable request body sent to a webhook endpoint.
 * JSON endpoints receive the canonical envelope, while chat destinations receive
 * platform-specific message payloads.
 */
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
