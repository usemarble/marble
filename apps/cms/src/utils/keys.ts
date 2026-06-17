import type { ApiScope } from "@marble/utils";
import {
  API_KEY_PRIVATE_ONLY_SCOPES,
  API_KEY_SCOPES,
  API_KEY_WRITE_SCOPES,
  DEFAULT_PRIVATE_API_KEY_SCOPES,
  DEFAULT_PUBLIC_API_KEY_SCOPES,
  API_KEY_PREFIXES as PREFIXES,
} from "@marble/utils";

export type { ApiScope } from "@marble/utils";
// biome-ignore lint/performance/noBarrelFile: <>
export { API_KEY_PREFIXES } from "@marble/utils";

export type ApiKeyPrefix = (typeof PREFIXES)[keyof typeof PREFIXES];

/**
 * Default scopes for public API keys (read-only access)
 */
export const DEFAULT_PUBLIC_SCOPES = DEFAULT_PUBLIC_API_KEY_SCOPES;

/**
 * Default scopes for private API keys (full access)
 */
export const DEFAULT_PRIVATE_SCOPES = DEFAULT_PRIVATE_API_KEY_SCOPES;

export const WRITE_SCOPES = API_KEY_WRITE_SCOPES;
export const PRIVATE_ONLY_SCOPES = API_KEY_PRIVATE_ONLY_SCOPES;

/**
 * Validates if an API key has a valid prefix
 * @param key - The API key to validate
 * @returns The key type if valid, null otherwise
 */
export function getApiKeyType(key: string): "public" | "private" | null {
  if (key.startsWith(PREFIXES.public)) {
    return "public";
  }
  if (key.startsWith(PREFIXES.private)) {
    return "private";
  }
  return null;
}

/**
 * Valid scope values matching the ApiScope enum
 */
export const VALID_SCOPES = API_KEY_SCOPES;

/**
 * Parse permissions string (comma-separated) into scopes array
 * @param permissions - Comma-separated permissions string (should be underscore format)
 * @returns Array of valid scope strings
 */
export function parseScopes(permissions: string | null): ApiScope[] {
  if (!permissions) {
    return [];
  }

  return permissions
    .split(",")
    .map((p) => p.trim())
    .filter((scope): scope is ApiScope =>
      VALID_SCOPES.includes(scope as ApiScope)
    );
}

/**
 * Check if a scope exists in the scopes array
 * @param scopes - Array of scopes to check
 * @param scope - Scope to check for
 * @returns True if scope exists
 */
export function hasScope(scopes: ApiScope[], scope: ApiScope): boolean {
  return scopes.includes(scope);
}

/**
 * Validate that all scope strings are valid
 * @param scopes - Array of scope strings to validate
 * @returns True if all scopes are valid
 */
export function validateScopes(scopes: string[]): boolean {
  return scopes.every((scope) => VALID_SCOPES.includes(scope as ApiScope));
}

export function getPublicKeyWriteScopes(scopes: ApiScope[]): ApiScope[] {
  const writeScopes: readonly ApiScope[] = WRITE_SCOPES;
  return scopes.filter((scope) => writeScopes.includes(scope));
}

export function getPublicKeyForbiddenScopes(scopes: ApiScope[]): ApiScope[] {
  const privateOnlyScopes: readonly ApiScope[] = PRIVATE_ONLY_SCOPES;
  return scopes.filter((scope) => privateOnlyScopes.includes(scope));
}
