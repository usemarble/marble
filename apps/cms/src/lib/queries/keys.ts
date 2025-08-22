export const QUERY_KEYS = {
  WORKSPACE_LIST: "workspaces",
  WORKSPACE: (id: string) => ["workspace", id],

  USER: "user",

  POSTS: "posts",
  POST: (id: string) => ["posts", id],

  TAGS: "tags",
  TAG: (id: string) => ["tags", id],

  CATEGORIES: "categories",
  CATEGORY: (id: string) => ["categories", id],

  MEDIA: "media",

  TEAM: "team",

  WEBHOOKS: "webhooks",
};
