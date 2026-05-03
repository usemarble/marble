import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { deleteJsonApi, readJsonApi, writeJsonApi } from "@/lib/api";
import { toolResult } from "@/lib/mcp";
import {
  identifierInput,
  namedResourceBody,
  paginationInput,
  updateNamedResourceBody,
} from "./shared";

export function registerCategoryTools(
  server: McpServer,
  apiBaseUrl: string,
  apiKey: string
) {
  server.registerTool(
    "get_categories",
    {
      title: "Get Categories",
      description:
        "Get a paginated list of categories in the Marble workspace.",
      inputSchema: paginationInput,
    },
    async ({ limit, page }) =>
      toolResult(
        await readJsonApi(apiBaseUrl, apiKey, "/v1/categories", { limit, page })
      )
  );

  server.registerTool(
    "get_category",
    {
      title: "Get Category",
      description: "Get a single category by ID or slug.",
      inputSchema: identifierInput,
    },
    async ({ identifier }) =>
      toolResult(
        await readJsonApi(
          apiBaseUrl,
          apiKey,
          `/v1/categories/${encodeURIComponent(identifier)}`
        )
      )
  );

  server.registerTool(
    "create_category",
    {
      title: "Create Category",
      description: "Create a new category. Requires a private Marble API key.",
      inputSchema: {
        body: z.object(namedResourceBody),
      },
    },
    async ({ body }) =>
      toolResult(
        await writeJsonApi(apiBaseUrl, apiKey, "POST", "/v1/categories", body)
      )
  );

  server.registerTool(
    "update_category",
    {
      title: "Update Category",
      description:
        "Update an existing category by ID or slug. Requires a private Marble API key.",
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
          `/v1/categories/${encodeURIComponent(identifier)}`,
          body
        )
      )
  );

  server.registerTool(
    "delete_category",
    {
      title: "Delete Category",
      description:
        "Delete a category by ID or slug. Requires a private Marble API key. The API rejects categories that still have posts assigned.",
      inputSchema: identifierInput,
    },
    async ({ identifier }) =>
      toolResult(
        await deleteJsonApi(
          apiBaseUrl,
          apiKey,
          `/v1/categories/${encodeURIComponent(identifier)}`
        )
      )
  );
}
