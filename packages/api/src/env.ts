/**
 * The bindings packages/api reads. The Worker passes its generated
 * `Cloudflare.Env`, which satisfies this structurally; it is declared here
 * because the generated type lives in apps/api and a package can't import it.
 */
export interface ApiEnv {
  APP_URL: string;
  AI_GATEWAY_API_KEY: string;
  BETTER_AUTH_SECRET: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_S3_ENDPOINT: string;
  R2_BUCKET_NAME: string;
  STORAGE_PUBLIC_URL: string;
  POLAR_ACCESS_TOKEN: string;
  POLAR_SERVER: "sandbox" | "production";
  REDIS_URL: string;
  REDIS_TOKEN: string;
  STORAGE: {
    head(key: string): Promise<{
      size: number;
      httpMetadata?: { contentType?: string };
    } | null>;
    get(key: string): Promise<{ body: ReadableStream; size: number } | null>;
    delete(key: string | string[]): Promise<void>;
  };
}
