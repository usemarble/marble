import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { deleteJsonApi, readJsonApi, writeJsonApi } from "@/lib/api";
import { toolResult } from "@/lib/mcp";
import { identifierInput, paginationInput } from "./shared";

const postFilters = {
  order: z.enum(["asc", "desc"]).optional(),
  status: z.enum(["published", "draft", "all"]).optional(),
  format: z.enum(["html", "markdown"]).optional(),
  featured: z.enum(["true", "false"]).optional(),
  categories: z.array(z.string()).optional(),
  excludeCategories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  excludeTags: z.array(z.string()).optional(),
};

const postBody = {
  title: z.string().min(1),
  content: z.string().min(1),
  description: z.string().min(1),
  slug: z.string().min(1),
  categoryId: z.string().min(1),
  status: z.enum(["published", "draft"]),
  tags: z.array(z.string()).optional(),
  authors: z
    .array(z.string())
    .optional()
    .describe("If omitted, the first workspace author is used."),
  featured: z.boolean().optional(),
  coverImage: z.url().nullable().optional(),
  publishedAt: z
    .string()
    .datetime()
    .optional()
    .describe("ISO 8601 datetime. Defaults to current time if omitted."),
};

const updatePostBody = {
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  status: z.enum(["published", "draft"]).optional(),
  tags: z.array(z.string()).optional().describe("Replaces existing tags."),
  authors: z.array(z.string()).optional().describe("Replaces existing authors."),
  featured: z.boolean().optional(),
  coverImage: z.url().nullable().optional(),
  publishedAt: z.string().datetime().optional(),
};

export function registerPostTools(
  server: McpServer,
  apiBaseUrl: string,
  apiKey: string
) {
  server.registerTool(
    "get_posts",
    {
      title: "Get Posts",
      description: "Get a paginated list of Marble posts with optional filters.",
      inputSchema: {
        ...paginationInput,
        ...postFilters,
        query: z
          .string()
          .optional()
          .describe("Search query for title and content."),
      },
    },
    async (params) =>
      toolResult(await readJsonApi(apiBaseUrl, apiKey, "/v1/posts", params))
  );

  server.registerTool(
    "search_posts",
    {
      title: "Search Posts",
      description:
        "Search Marble posts by title and content. Use status 'all' when the user wants drafts included.",
      inputSchema: {
        ...paginationInput,
        query: z.string().min(1),
        status: z.enum(["published", "draft", "all"]).optional(),
        format: z.enum(["html", "markdown"]).optional(),
      },
    },
    async (params) =>
      toolResult(await readJsonApi(apiBaseUrl, apiKey, "/v1/posts", params))
  );

  server.registerTool(
    "get_post",
    {
      title: "Get Post",
      description: "Get a single Marble post by ID or slug.",
      inputSchema: {
        ...identifierInput,
        status: z.enum(["published", "draft", "all"]).optional(),
        format: z.enum(["html", "markdown"]).optional(),
      },
    },
    async ({ identifier, status, format }) =>
      toolResult(
        await readJsonApi(
          apiBaseUrl,
          apiKey,
          `/v1/posts/${encodeURIComponent(identifier)}`,
          { status, format }
        )
      )
  );

  server.registerTool(
    "create_post",
    {
      title: "Create Post",
      description:
        "Create a new post. Requires a private Marble API key. Category is required. If authors are omitted, the first workspace author is used.",
      inputSchema: {
        body: z.object(postBody),
      },
    },
    async ({ body }) =>
      toolResult(await writeJsonApi(apiBaseUrl, apiKey, "POST", "/v1/posts", body))
  );

  server.registerTool(
    "update_post",
    {
      title: "Update Post",
      description:
        "Update an existing post by ID or slug. Requires a private Marble API key.",
      inputSchema: {
        ...identifierInput,
        body: z.object(updatePostBody),
      },
    },
    async ({ identifier, body }) =>
      toolResult(
        await writeJsonApi(
          apiBaseUrl,
          apiKey,
          "PATCH",
          `/v1/posts/${encodeURIComponent(identifier)}`,
          body
        )
      )
  );

  server.registerTool(
    "delete_post",
    {
      title: "Delete Post",
      description: "Delete a post by ID or slug. Requires a private Marble API key.",
      inputSchema: identifierInput,
    },
    async ({ identifier }) =>
      toolResult(
        await deleteJsonApi(
          apiBaseUrl,
          apiKey,
          `/v1/posts/${encodeURIComponent(identifier)}`
        )
      )
  );
}
