import type { MiddlewareHandler } from "hono";

/**
 * Default stale-if-error time in seconds.
 * This tells CDNs/browsers to serve stale content if the origin returns an error.
 */
const DEFAULT_STALE_IF_ERROR = 3600; // 1 hour

export interface CacheOptions {
  /**
   * Time in seconds for stale-if-error directive.
   * When the origin returns an error, CDNs can serve cached content for this duration.
   * @default 3600 (1 hour)
   */
  staleIfError?: number;
}

/**
 * Cache Control Middleware
 *
 * Automatically adds cache-related headers to successful GET/HEAD responses.
 * Currently adds `stale-if-error` directive to allow CDNs to serve stale content
 * when the origin returns errors.
 *
 * This middleware runs AFTER the route handler (post-processing) to inspect
 * the response status and existing headers before adding cache directives.
 *
 * @example
 * ```ts
 * // Use with default options (1 hour stale-if-error)
 * app.use("*", cache());
 *
 * // Use with custom stale-if-error time
 * app.use("*", cache({ staleIfError: 7200 })); // 2 hours
 * ```
 *
 * @param options - Configuration options for cache behavior
 * @returns Hono middleware handler
 */
export const cache = (options: CacheOptions = {}): MiddlewareHandler => {
  const staleIfError = options.staleIfError ?? DEFAULT_STALE_IF_ERROR;

  return async (c, next) => {
    await next();

    const method = c.req.method;

    // Only apply cache headers to GET and HEAD requests
    if (method !== "GET" && method !== "HEAD") {
      return;
    }

    // Only apply to successful responses (2xx and 3xx)
    const status = c.res.status ?? 200;
    if (status < 200 || status >= 400) {
      return;
    }

    const existingCacheControl = c.res.headers.get("Cache-Control") ?? "";

    // Skip if response explicitly opts out of caching
    if (/\bno-store\b/i.test(existingCacheControl)) {
      return;
    }

    // Skip if stale-if-error is already set
    if (/\bstale-if-error\s*=\s*\d+\b/i.test(existingCacheControl)) {
      return;
    }

    // Append stale-if-error to existing Cache-Control header
    const newValue = existingCacheControl
      ? `${existingCacheControl}, stale-if-error=${staleIfError}`
      : `stale-if-error=${staleIfError}`;

    c.header("Cache-Control", newValue);
  };
};
