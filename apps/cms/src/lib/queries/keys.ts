export const QUERY_KEYS = {
  // Workspace keys
  WORKSPACE_LIST: ["workspaces"],
  WORKSPACE: (id: string) => ["workspace", id],

  // Non-workspace scoped
  USER: ["user"],

  // Workspace-scoped resources (always use workspace ID)
  POSTS: (workspaceId: string) => ["posts", workspaceId],
  POST: (workspaceId: string, postId: string) => ["posts", workspaceId, postId],

  TAGS: (workspaceId: string) => ["tags", workspaceId],
  TAG: (workspaceId: string, tagId: string) => ["tags", workspaceId, tagId],

  CATEGORIES: (workspaceId: string) => ["categories", workspaceId],
  CATEGORY: (workspaceId: string, categoryId: string) => [
    "categories",
    workspaceId,
    categoryId,
  ],

  MEDIA: (workspaceId: string) => ["media", workspaceId],

  TEAM: (workspaceId: string) => ["team", workspaceId],

  WEBHOOKS: (workspaceId: string) => ["webhooks", workspaceId],
};
