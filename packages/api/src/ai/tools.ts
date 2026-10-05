import { tool } from "ai";
import { z } from "zod";
import type { ServiceContext } from "../context";
import { listAuthors } from "../services/authors";
import { listCategories } from "../services/categories";
import { listMedia } from "../services/media";
import { listPosts } from "../services/posts";
import { listTags } from "../services/tags";
import { untrusted } from "./untrusted";

const MAX_RECENT_POSTS = 20;

/**
 * The assistant's tools, built for one request and bound to the workspace the
 * caller was already authorized for. The model never supplies a workspace: it
 * can only read this one. Read-only, and each calls an existing service.
 */
export function createAssistantTools({
  ctx,
  workspaceId,
}: {
  ctx: ServiceContext;
  workspaceId: string;
}) {
  const countPosts = async (status: "all" | "draft" | "published") => {
    const { totalCount } = await listPosts(ctx, workspaceId, {
      category: "all",
      page: 1,
      perPage: 1,
      search: "",
      sort: "createdAt_desc",
      status,
    });
    return totalCount;
  };

  return {
    getWorkspaceSummary: tool({
      description:
        "Counts for the current workspace: posts overall and by status (published, draft), and how many authors, tags, categories and media files it has.",
      inputSchema: z.object({}),
      execute: async () => {
        const [total, published, draft, authors, tags, categories, media] =
          await Promise.all([
            countPosts("all"),
            countPosts("published"),
            countPosts("draft"),
            listAuthors(ctx, workspaceId),
            listTags(ctx, workspaceId),
            listCategories(ctx, workspaceId),
            listMedia(ctx, workspaceId, {
              page: 1,
              perPage: 1,
              sort: "createdAt_desc",
            }),
          ]);
        return {
          posts: { total, published, draft },
          authors: authors.length,
          tags: tags.length,
          categories: categories.length,
          media: media.totalCount,
        };
      },
    }),
    listRecentPosts: tool({
      description:
        "The most recently updated posts in the current workspace, newest first: title, status and when each was last updated.",
      inputSchema: z.object({
        limit: z
          .number()
          .int()
          .min(1)
          .max(MAX_RECENT_POSTS)
          .optional()
          .describe(
            `How many posts to return (default 10, at most ${MAX_RECENT_POSTS})`
          ),
        status: z
          .enum(["all", "published", "draft"])
          .optional()
          .describe("Only posts with this status (default all)"),
      }),
      execute: async ({ limit, status }) => {
        const { posts, totalCount } = await listPosts(ctx, workspaceId, {
          category: "all",
          page: 1,
          perPage: Math.min(limit ?? 10, MAX_RECENT_POSTS),
          search: "",
          sort: "updatedAt_desc",
          status: status ?? "all",
        });
        return {
          total: totalCount,
          posts: posts.map((entry) => ({
            title: untrusted(entry.title),
            status: entry.status,
            updatedAt: entry.updatedAt.toISOString(),
          })),
        };
      },
    }),
  };
}

export type AssistantTools = ReturnType<typeof createAssistantTools>;
