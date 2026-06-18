import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getServerInstructions } from "@/lib/instructions";
import { registerAuthorTools } from "@/tools/authors";
import { registerCategoryTools } from "@/tools/categories";
import { registerFieldTools } from "@/tools/fields";
import { registerMediaTools } from "@/tools/media";
import { registerPostTools } from "@/tools/posts";
import { registerTagTools } from "@/tools/tags";

export function createServer(apiBaseUrl: string, apiKey: string) {
  const server = new McpServer(
    {
      name: "Marble",
      version: "1.0.0",
    },
    {
      instructions: getServerInstructions(),
    }
  );

  registerPostTools(server, apiBaseUrl, apiKey);
  registerCategoryTools(server, apiBaseUrl, apiKey);
  registerTagTools(server, apiBaseUrl, apiKey);
  registerAuthorTools(server, apiBaseUrl, apiKey);
  registerMediaTools(server, apiBaseUrl, apiKey);
  registerFieldTools(server, apiBaseUrl, apiKey);

  return server;
}
