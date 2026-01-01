export interface Env {
  DATABASE_URL: string;
  REDIS_URL: string;
  REDIS_TOKEN: string;
  POLAR_ACCESS_TOKEN: string;
  ENVIRONMENT?: string;
  SYSTEM_SECRET: string;
}

// Context variables set by keyAuthorization middleware
export interface ApiKeyVariables {
  workspaceId: string;
  apiKeyId: string;
  apiKeyType: "public" | "private";
}

// Hono app type for API key authenticated routes
export interface ApiKeyApp {
  Bindings: Env;
  Variables: ApiKeyVariables;
}
