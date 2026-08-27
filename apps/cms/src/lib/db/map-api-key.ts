import type { ApiKeyType, ApiScope as DrizzleApiScope } from "@marble/drizzle/types";
import type { APIKey } from "@/types/dashboard";
import type { ApiScope } from "@/utils/keys";

type ApiKeyRow = {
  id: string;
  name: string;
  preview: string;
  type: ApiKeyType;
  scopes: DrizzleApiScope[];
  enabled: boolean;
  requestCount: number;
  lastUsed: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
};

export function mapDashboardApiKey(key: ApiKeyRow): APIKey {
  return {
    ...key,
    scopes: key.scopes as ApiScope[],
  };
}
