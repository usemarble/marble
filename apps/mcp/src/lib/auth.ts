/**
 * Reads the Marble API key from the headers MCP clients can realistically send.
 * Cursor and mcp-remote support custom headers, while some clients prefer the
 * standard Authorization header.
 */
export function getApiKey(request: Request) {
  const apiKey =
    request.headers.get("mcp-marble-api-key") ??
    request.headers.get("x-marble-api-key") ??
    request.headers.get("authorization");

  if (!apiKey) {
    throw new Error(
      "Missing Marble API key. Pass Authorization, Mcp-Marble-Api-Key, or X-Marble-Api-Key to the MCP server."
    );
  }

  return apiKey;
}

/**
 * Normalizes a raw Marble API key into the Authorization header format expected
 * by the Marble API. Existing Bearer values are preserved.
 */
export function authHeaderValue(apiKey: string) {
  return apiKey.toLowerCase().startsWith("bearer ") ? apiKey : `Bearer ${apiKey}`;
}
