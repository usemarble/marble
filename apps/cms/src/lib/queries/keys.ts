export const QUERY_KEYS = {
  // Workspace keys
  WORKSPACE_LIST: ["workspaces"],
  WORKSPACE: (id: string) => ["workspace", id],
  WORKSPACE_BY_SLUG: (slug: string) => ["workspace_by_slug", slug],

  // Workspace-scoped resources
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
  AUTHORS: (workspaceId: string) => ["authors", workspaceId],

  WEBHOOKS: (workspaceId: string) => ["webhooks", workspaceId],

  BILLING_USAGE: (workspaceId: string) => ["billing-usage", workspaceId],

  PUBLISHING_METRICS: (workspaceId: string) => [
    "publishing-metrics",
    workspaceId,
  ],

  API_ANALYTICS: (workspaceId: string) => [
    "analytics",
    "api-usage",
    workspaceId,
  ],

  WORKSPACE_METRICS: (workspaceId: string) => [
    "workspace-metrics",
    workspaceId,
  ],

  AI_READABILITY_SUGGESTIONS: (workspaceId: string, contentKey: string) => [
    "ai-readability-suggestions",
    workspaceId,
    contentKey,
  ],

  // Globally scoped
  USER: ["user"],
};
