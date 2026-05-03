import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { deleteJsonApi, readJsonApi, writeJsonApi } from "@/lib/api";
import { toolResult } from "@/lib/mcp";
import { identifierInput, paginationInput } from "./shared";

const socialInput = z.object({
  platform: z.enum([
    "x",
    "twitter",
    "github",
    "facebook",
    "instagram",
    "youtube",
    "tiktok",
    "linkedin",
    "website",
    "onlyfans",
    "discord",
    "bluesky",
  ]),
  url: z.string().url(),
});

const authorBody = {
  name: z.string().min(1),
  slug: z.string().min(1),
  bio: z.string().nullable().optional(),
  role: z.string().nullable().optional(),
  email: z.email().nullable().optional(),
  image: z.url().nullable().optional(),
  socials: z.array(socialInput).optional(),
};

const updateAuthorBody = {
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  bio: z.string().nullable().optional(),
  role: z.string().nullable().optional(),
  email: z.email().nullable().optional(),
  image: z.url().nullable().optional(),
  socials: z
    .array(socialInput)
    .optional()
    .describe("Replaces all existing socials when provided."),
};

export function registerAuthorTools(
  server: McpServer,
  apiBaseUrl: string,
  apiKey: string
) {
  server.registerTool(
    "get_authors",
    {
      title: "Get Authors",
      description: "Get a paginated list of authors in the Marble workspace.",
      inputSchema: paginationInput,
    },
    async ({ limit, page }) =>
      toolResult(
        await readJsonApi(apiBaseUrl, apiKey, "/v1/authors", { limit, page })
      )
  );

  server.registerTool(
    "get_author",
    {
      title: "Get Author",
      description: "Get a single author by ID or slug.",
      inputSchema: identifierInput,
    },
    async ({ identifier }) =>
      toolResult(
        await readJsonApi(
          apiBaseUrl,
          apiKey,
          `/v1/authors/${encodeURIComponent(identifier)}`
        )
      )
  );

  server.registerTool(
    "create_author",
    {
      title: "Create Author",
      description: "Create a new author. Requires a private Marble API key.",
      inputSchema: {
        body: z.object(authorBody),
      },
    },
    async ({ body }) =>
      toolResult(
        await writeJsonApi(apiBaseUrl, apiKey, "POST", "/v1/authors", body)
      )
  );

  server.registerTool(
    "update_author",
    {
      title: "Update Author",
      description:
        "Update an existing author by ID or slug. Requires a private Marble API key.",
      inputSchema: {
        ...identifierInput,
        body: z.object(updateAuthorBody),
      },
    },
    async ({ identifier, body }) =>
      toolResult(
        await writeJsonApi(
          apiBaseUrl,
          apiKey,
          "PATCH",
          `/v1/authors/${encodeURIComponent(identifier)}`,
          body
        )
      )
  );

  server.registerTool(
    "delete_author",
    {
      title: "Delete Author",
      description:
        "Delete an author by ID or slug. Requires a private Marble API key.",
      inputSchema: identifierInput,
    },
    async ({ identifier }) =>
      toolResult(
        await deleteJsonApi(
          apiBaseUrl,
          apiKey,
          `/v1/authors/${encodeURIComponent(identifier)}`
        )
      )
  );
}
