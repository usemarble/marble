export type Env = {
  DATABASE_URL: string;
  REDIS_URL: string;
  REDIS_TOKEN: string;
  POLAR_ACCESS_TOKEN: string;
  ENVIRONMENT?: string;
  SYSTEM_SECRET: string;
};

// Context variables set by keyAuthorization middleware
export type ApiKeyVariables = {
  workspaceId: string;
  apiKeyId: string;
  apiKeyType: "public" | "private";
};

// Hono app type for API key authenticated routes
export type ApiKeyApp = {
  Bindings: Env;
  Variables: ApiKeyVariables;
};
