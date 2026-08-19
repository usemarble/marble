/**
 * Reads the Marble API key from the standard API header first, then falls back
 * to custom headers for MCP clients that need them.
 */
export function getApiKey(request: Request) {
  const authorization = request.headers.get("authorization");
  const apiKey =
    parseAuthorizationHeader(authorization) ??
    request.headers.get("mcp-marble-api-key") ??
    request.headers.get("x-marble-api-key");

  if (!apiKey) {
    throw new Error("Missing Marble API key.");
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

  const value = header.trim();
  if (!value) {
    return null;
  }

  const match = /^Bearer\s+(.+)$/i.exec(value);
  return match?.[1] ?? value;
}
