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

const POST_STATUSES = ["published", "draft", "scheduled"] as const;

const postStatusFilter = z
  .enum([...POST_STATUSES, "all"])
  .optional()
  .describe(
    "Filter by post status. Defaults to published posts. Use scheduled for posts waiting to go live. all means published and draft, and never includes scheduled posts."
  );

const publishedAtInput = z.iso.datetime({ offset: true, local: true });

const postFilters = {
  order: z.enum(["asc", "desc"]).optional().describe("Sort order."),
  status: postStatusFilter,
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

const customFieldValue = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()),
  z.null(),
]);

const customFields = z
  .record(z.string(), customFieldValue)
  .describe(
    "Custom field values keyed by field key. Call get_fields first. Select values must use option values, multiselect values must be arrays of option values, and null clears optional fields."
  );

const postBody = {
  title: z.string().min(1).describe("Post title."),
  content: z
    .string()
    .min(1)
    .describe(
      "Post body content as HTML. Use clean semantic HTML. Marble sanitizes content before storing it, so avoid scripts, event handlers, unsupported attributes, unsafe URL schemes, and non-YouTube iframes. For captioned images or videos, prefer editor-compatible figure markup. Figure captions may contain inline links and inline formatting tags: a, strong, b, em, i, s, u, code, span, and mark."
    ),
  description: z.string().min(1).describe("Short post description or excerpt."),
  slug: z.string().min(1).describe("URL-friendly post slug."),
  categoryId: z.string().min(1).describe("Required category ID for the post."),
  status: z
    .enum(POST_STATUSES)
    .describe(
      "Initial post status. published is live immediately, even with a future publishedAt. scheduled goes live at publishedAt, which must be in the future."
    ),
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
  publishedAt: publishedAtInput
    .optional()
    .describe(
      "ISO 8601 datetime. Defaults to current time if omitted. With no offset, as in 2026-11-01T09:00:00, it means workspace time. Send Z or an offset such as +01:00 only when the user names a zone."
    ),
  fields: customFields.optional(),
};

const updatePostBody = {
  title: z.string().min(1).optional().describe("Updated post title."),
  content: z
    .string()
    .min(1)
    .optional()
    .describe(
      "Updated post body content as HTML. Use clean semantic HTML. Marble sanitizes content before storing it, so avoid scripts, event handlers, unsupported attributes, unsafe URL schemes, and non-YouTube iframes. For captioned images or videos, prefer editor-compatible figure markup. Figure captions may contain inline links and inline formatting tags: a, strong, b, em, i, s, u, code, span, and mark."
    ),
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
    .enum(POST_STATUSES)
    .optional()
    .describe(
      "Updated post status. scheduled needs a future publishedAt, sent here or already stored on the post."
    ),
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
  publishedAt: publishedAtInput
    .optional()
    .describe(
      "Updated ISO 8601 publication datetime. With no offset, as in 2026-11-01T09:00:00, it means workspace time. Send Z or an offset such as +01:00 only when the user names a zone."
    ),
  fields: customFields.optional(),
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
        "Get a paginated list of published posts with optional filtering. Use status to read drafts or scheduled posts.",
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
        "Search Marble posts by title and content. Use status 'all' when the user wants drafts included, or 'scheduled' for posts waiting to go live.",
      annotations: readOnlyAnnotations,
      inputSchema: {
        ...paginationInput,
        query: z.string().min(1),
        status: postStatusFilter,
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
        status: postStatusFilter,
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
        "Create a new post. Requires a private Marble API key. Category is required. If authors are omitted, the first workspace author is used. To schedule, send status scheduled and a publishedAt with no offset, then repeat the time and the workspaceTimezone from the response to the user.",
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
        "Update an existing post by ID or slug. All fields are optional - only provided fields are updated. Requires a private Marble API key. To schedule, send status scheduled and a publishedAt with no offset, then repeat the time and the workspaceTimezone from the response to the user.",
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
