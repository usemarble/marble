import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { deleteJsonApi, readJsonApi, writeJsonApi } from "@/lib/api";
import { toolResult } from "@/lib/mcp";
import {
  destructiveAnnotations,
  identifierInput,
  paginationInput,
  readOnlyAnnotations,
} from "./shared";

const socialInput = z.object({
  platform: z
    .enum([
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
    ])
    .describe("Social media platform."),
  url: z.string().url().describe("Social profile URL."),
});

const authorBody = {
  name: z.string().min(1).describe("Author display name."),
  slug: z.string().min(1).describe("URL-friendly author slug."),
  bio: z.string().nullable().optional().describe("Author bio."),
  role: z.string().nullable().optional().describe("Author role or title."),
  email: z.email().nullable().optional().describe("Author email address."),
  image: z.url().nullable().optional().describe("Author image URL."),
  socials: z
    .array(socialInput)
    .optional()
    .describe("Social media links for this author."),
};

const updateAuthorBody = {
  name: z.string().min(1).optional().describe("Updated author display name."),
  slug: z
    .string()
    .min(1)
    .optional()
    .describe("Updated URL-friendly author slug."),
  bio: z.string().nullable().optional().describe("Updated author bio."),
  role: z
    .string()
    .nullable()
    .optional()
    .describe("Updated author role or title."),
  email: z
    .email()
    .nullable()
    .optional()
    .describe("Updated author email address."),
  image: z.url().nullable().optional().describe("Updated author image URL."),
  socials: z
    .array(socialInput)
    .optional()
    .describe(
      "Social media links. Replaces all existing socials when provided."
    ),
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
      description: "Get a paginated list of authors who have published posts.",
      annotations: readOnlyAnnotations,
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
      annotations: readOnlyAnnotations,
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
      description:
        "Create a new author. Requires a private Marble API key. Hobby plan is limited to 1 author.",
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
      annotations: destructiveAnnotations,
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
      annotations: destructiveAnnotations,
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
