/**
 * Reads the Marble API key from the headers MCP clients can realistically send.
 * Cursor and mcp-remote support custom headers, while some clients prefer the
 * standard Authorization header.
 */
export function getApiKey(request: Request) {
  const authorization = request.headers.get("authorization");
  const apiKey =
    request.headers.get("mcp-marble-api-key") ??
    request.headers.get("x-marble-api-key") ??
    parseAuthorizationHeader(authorization);

  if (!apiKey) {
    throw new Error(
      authorization
        ? "Unsupported Authorization header. Use Authorization: Bearer <key>."
        : "Missing Marble API key."
    );
  }

  return apiKey;
}

/**
 * Normalizes a raw Marble API key into the Authorization header format expected
 * by the Marble API.
 */
export function authHeaderValue(apiKey: string) {
  const bearerMatch = /^Bearer\s+(.+)$/i.exec(apiKey.trim());
  if (bearerMatch) {
    return `Bearer ${bearerMatch[1]}`;
  }

  if (/^[a-z]+ /i.test(apiKey)) {
    throw new Error(
      "Unsupported API key header value. Use a raw key or Bearer token."
    );
  }

  return `Bearer ${apiKey}`;
}

function parseAuthorizationHeader(header: string | null) {
  if (!header) {
    return null;
  }

  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match?.[1] ?? null;
}
