export interface Env {
  DATABASE_URL: string;
  HYPERDRIVE: { connectionString: string };
  STORAGE: R2Bucket;
  STORAGE_PUBLIC_URL?: string;
  REDIS_URL: string;
  REDIS_TOKEN: string;
  POLAR_ACCESS_TOKEN: string;
  ENVIRONMENT?: string;
  SYSTEM_SECRET: string;
  RESEND_API_KEY: string;
  EVENT_QUEUE: Queue;
}

// Context variables set by keyAuthorization middleware
export interface ApiKeyVariables {
  workspaceId?: string;
  apiKeyId?: string;
  apiKeyType?: "public" | "private";
}

// Hono app type for API key authenticated routes
export interface ApiKeyApp {
  Bindings: Env;
  Variables: ApiKeyVariables;
}
