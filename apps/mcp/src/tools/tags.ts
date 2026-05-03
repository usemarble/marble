import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { deleteJsonApi, readJsonApi, writeJsonApi } from "@/lib/api";
import { toolResult } from "@/lib/mcp";
import {
  destructiveAnnotations,
  identifierInput,
  namedResourceBody,
  paginationInput,
  readOnlyAnnotations,
  updateNamedResourceBody,
} from "./shared";

export function registerTagTools(
  server: McpServer,
  apiBaseUrl: string,
  apiKey: string
) {
  server.registerTool(
    "get_tags",
    {
      title: "Get Tags",
      description: "Get a paginated list of tags.",
      annotations: readOnlyAnnotations,
      inputSchema: paginationInput,
    },
    async ({ limit, page }) =>
      toolResult(
        await readJsonApi(apiBaseUrl, apiKey, "/v1/tags", { limit, page })
      )
  );

  server.registerTool(
    "get_tag",
    {
      title: "Get Tag",
      description: "Get a single tag by ID or slug.",
      annotations: readOnlyAnnotations,
      inputSchema: identifierInput,
    },
    async ({ identifier }) =>
      toolResult(
        await readJsonApi(
          apiBaseUrl,
          apiKey,
          `/v1/tags/${encodeURIComponent(identifier)}`
        )
      )
  );

  server.registerTool(
    "create_tag",
    {
      title: "Create Tag",
      description: "Create a new tag. Requires a private Marble API key.",
      inputSchema: {
        body: z.object(namedResourceBody),
      },
    },
    async ({ body }) =>
      toolResult(
        await writeJsonApi(apiBaseUrl, apiKey, "POST", "/v1/tags", body)
      )
  );

  server.registerTool(
    "update_tag",
    {
      title: "Update Tag",
      description:
        "Update an existing tag by ID or slug. Requires a private Marble API key.",
      annotations: destructiveAnnotations,
      inputSchema: {
        ...identifierInput,
        body: z.object(updateNamedResourceBody),
      },
    },
    async ({ identifier, body }) =>
      toolResult(
        await writeJsonApi(
          apiBaseUrl,
          apiKey,
          "PATCH",
          `/v1/tags/${encodeURIComponent(identifier)}`,
          body
        )
      )
  );

  server.registerTool(
    "delete_tag",
    {
      title: "Delete Tag",
      description:
        "Delete a tag by ID or slug. Requires a private Marble API key.",
      annotations: destructiveAnnotations,
      inputSchema: identifierInput,
    },
    async ({ identifier }) =>
      toolResult(
        await deleteJsonApi(
          apiBaseUrl,
          apiKey,
          `/v1/tags/${encodeURIComponent(identifier)}`
        )
      )
  );
}
