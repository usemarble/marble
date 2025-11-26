/**
 * API Key Prefixes
 * Used to identify and validate API key types
 */
export const API_KEY_PREFIXES = {
  public: "mpk",
  private: "msk",
} as const;

export type ApiKeyPrefix =
  (typeof API_KEY_PREFIXES)[keyof typeof API_KEY_PREFIXES];

/**
 * Default scopes for public API keys (read-only access)
 */
export const DEFAULT_PUBLIC_SCOPES = [
  "posts_read",
  "authors_read",
  "categories_read",
  "tags_read",
  "media_read",
] as const;

/**
 * Default scopes for private API keys (full access)
 */
export const DEFAULT_PRIVATE_SCOPES = [
  "posts_read",
  "posts_write",
  "authors_read",
  "authors_write",
  "categories_read",
  "categories_write",
  "tags_read",
  "tags_write",
  "media_read",
  "media_write",
] as const;

/**
 * Validates if an API key has a valid prefix
 * @param key - The API key to validate
 * @returns The key type if valid, null otherwise
 */
export function getApiKeyType(key: string): "public" | "private" | null {
  if (key.startsWith(API_KEY_PREFIXES.public)) {
    return "public";
  }
  if (key.startsWith(API_KEY_PREFIXES.private)) {
    return "private";
  }
  return null;
}

/**
 * Valid scope values matching the ApiScope enum
 */
export const VALID_SCOPES = [
  "posts_read",
  "posts_write",
  "authors_read",
  "authors_write",
  "categories_read",
  "categories_write",
  "tags_read",
  "tags_write",
  "media_read",
  "media_write",
] as const;

export type ApiScope = (typeof VALID_SCOPES)[number];

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
