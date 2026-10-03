export const QUERY_KEYS = {
  // Workspace-scoped resources

  MEDIA: (workspaceId: string) => ["media", workspaceId],
  MEDIA_DETAIL: (workspaceId: string, mediaId: string) => [
    "media",
    workspaceId,
    mediaId,
  ],

  TEAM: (workspaceId: string) => ["team", workspaceId],

  EXPORTS: (workspaceId: string) => ["exports", workspaceId],
  IMPORTS: (workspaceId: string) => ["imports", workspaceId],

  CUSTOM_FIELDS: (workspaceId: string) => ["custom-fields", workspaceId],

  KEYS: (workspaceId: string) => ["keys", workspaceId],

  BILLING_USAGE: (workspaceId: string) => ["billing-usage", workspaceId],

  USAGE_DASHBOARD: (workspaceId: string) => ["usage-dashboard", workspaceId],

  AI_READABILITY_SUGGESTIONS: (workspaceId: string, contentKey: string) => [
    "ai-readability-suggestions",
    workspaceId,
    contentKey,
  ],

  PUBLISHING_METRICS: (workspaceId: string) => [
    "publishing-metrics",
    workspaceId,
  ],

  // Globally scoped
  USER: ["user"],
  NOTIFICATION_PREFERENCES: ["notification-preferences"],
};
