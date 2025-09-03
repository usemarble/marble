import { EmbedBuilder } from "@discordjs/builders";
import type { RESTPostAPIWebhookWithTokenJSONBody } from "discord-api-types/v10";
import type { WebhookBody } from "./webhook-client";

const MARBLE_COLOR = 5786879;
const MARBLE_AVATAR_URL = "https://app.marblecms.com/logo.png";

function formatEvent(input: string): string {
  return (
    input.replace(/\./g, " ").replace(/\b\w/g, (char) => char.toUpperCase()) +
    "!"
  );
}

export function getDiscordEmbed(args: {
  event: string;
  data: WebhookBody["data"];
  username?: string;
}): RESTPostAPIWebhookWithTokenJSONBody {
  const { event, data, username = undefined } = args;

  const embed = new EmbedBuilder()
    .setTitle(formatEvent(event))
    .setDescription(event)
    .setColor(MARBLE_COLOR)
    .setAuthor({
      name: "Marble",
      iconURL: MARBLE_AVATAR_URL,
    })
    .setFooter({
      text: "Powered by marblecms.com",
    });

  const fields = [
    { name: "ID", value: data.id },
    { name: "Performed By", value: username ? `${username} (${data.userId})` : data.userId },
  ];

  if ("slug" in data) {
    fields.splice(1, 0, { name: "Slug", value: data.slug });
  } else if ("name" in data) {
    fields.splice(1, 0, { name: "Name", value: data.name });
  }

  embed.addFields(...fields);

  return {
    username: "Marble",
    avatar_url: MARBLE_AVATAR_URL,
    embeds: [embed.toJSON()],
    allowed_mentions: { parse: [] },
  };
}
