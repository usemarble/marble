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

const postFilters = {
  order: z.enum(["asc", "desc"]).optional().describe("Sort order."),
  status: z
    .enum(["published", "draft", "all"])
    .optional()
    .describe("Filter by post status. Defaults to published posts."),
  format: z
    .enum(["html", "markdown"])
    .optional()
    .describe("Content format to return."),
  featured: z
    .enum(["true", "false"])
    .optional()
    .describe("Filter by featured posts."),
  categories: z
    .array(z.string())
    .optional()
    .describe("Category IDs or slugs to include."),
  excludeCategories: z
    .array(z.string())
    .optional()
    .describe("Category IDs or slugs to exclude."),
  tags: z.array(z.string()).optional().describe("Tag IDs or slugs to include."),
  excludeTags: z
    .array(z.string())
    .optional()
    .describe("Tag IDs or slugs to exclude."),
};

const postBody = {
  title: z.string().min(1).describe("Post title."),
  content: z
    .string()
    .min(1)
    .describe("Post body content, usually HTML or Markdown."),
  description: z.string().min(1).describe("Short post description or excerpt."),
  slug: z.string().min(1).describe("URL-friendly post slug."),
  categoryId: z.string().min(1).describe("Required category ID for the post."),
  status: z
    .enum(["published", "draft"])
    .describe("Initial post status: published or draft."),
  tags: z
    .array(z.string())
    .optional()
    .describe("Array of tag IDs to attach to the post."),
  authors: z
    .array(z.string())
    .optional()
    .describe(
      "Array of author IDs. If omitted, the first workspace author is used."
    ),
  featured: z
    .boolean()
    .optional()
    .describe("Whether the post should be marked as featured."),
  coverImage: z
    .url()
    .nullable()
    .optional()
    .describe("Cover image URL. Use null to clear it."),
  publishedAt: z.iso
    .datetime()
    .optional()
    .describe("ISO 8601 datetime. Defaults to current time if omitted."),
};

const updatePostBody = {
  title: z.string().min(1).optional().describe("Updated post title."),
  content: z.string().min(1).optional().describe("Updated post body content."),
  description: z
    .string()
    .min(1)
    .optional()
    .describe("Updated short post description or excerpt."),
  slug: z
    .string()
    .min(1)
    .optional()
    .describe("Updated URL-friendly post slug."),
  categoryId: z.string().min(1).optional().describe("Updated category ID."),
  status: z
    .enum(["published", "draft"])
    .optional()
    .describe("Updated post status."),
  tags: z
    .array(z.string())
    .optional()
    .describe("Array of tag IDs. Replaces all existing tags when provided."),
  authors: z
    .array(z.string())
    .optional()
    .describe(
      "Array of author IDs. Replaces all existing authors when provided."
    ),
  featured: z.boolean().optional().describe("Updated featured status."),
  coverImage: z
    .url()
    .nullable()
    .optional()
    .describe("Updated cover image URL. Use null to clear it."),
  publishedAt: z.iso
    .datetime()
    .optional()
    .describe("Updated ISO 8601 publication datetime."),
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
      description:
        "Get a paginated list of published posts with optional filtering.",
      annotations: readOnlyAnnotations,
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
      annotations: readOnlyAnnotations,
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
      description:
        "Get a single post by ID or slug, with optional status filtering.",
      annotations: readOnlyAnnotations,
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
      toolResult(
        await writeJsonApi(apiBaseUrl, apiKey, "POST", "/v1/posts", body)
      )
  );

  server.registerTool(
    "update_post",
    {
      title: "Update Post",
      description:
        "Update an existing post by ID or slug. All fields are optional - only provided fields are updated. Requires a private Marble API key.",
      annotations: destructiveAnnotations,
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
      description:
        "Delete a post by ID or slug. Requires a private Marble API key.",
      annotations: destructiveAnnotations,
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
