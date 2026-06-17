import {
  API_KEY_SCOPE_BY_RESOURCE,
  type ApiScope,
} from "@marble/utils/api-key-scopes";
import type { MiddlewareHandler } from "hono";
import type { ApiKeyApp } from "@/types/env";

const READ_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function getRouteSegments(pathname: string): string[] {
  const segments = pathname.split("/").filter(Boolean);
  return segments[0] === "v1" ? segments.slice(1) : segments;
}

function getRequiredScope(method: string, pathname: string): ApiScope | null {
  const [resource] = getRouteSegments(pathname);
  const resourceScopes =
    API_KEY_SCOPE_BY_RESOURCE[
      resource as keyof typeof API_KEY_SCOPE_BY_RESOURCE
    ];

  if (!resourceScopes) {
    return null;
  }

  return READ_METHODS.has(method) ? resourceScopes.read : resourceScopes.write;
}

function hasScope(scopes: readonly ApiScope[], scope: ApiScope): boolean {
  return scopes.includes(scope);
}

function getDraftPostReadScope(
  method: string,
  pathname: string,
  status?: string
): ApiScope | null {
  if (!READ_METHODS.has(method) || status === undefined) {
    return null;
  }

  const [resource] = getRouteSegments(pathname);
  if (resource !== "posts" || (status !== "draft" && status !== "all")) {
    return null;
  }

  return API_KEY_SCOPE_BY_RESOURCE.posts.readDrafts;
}

export const scopeAuthorization =
  (): MiddlewareHandler<ApiKeyApp> => async (c, next) => {
    const scopes = c.get("apiKeyScopes") ?? [];
    const draftPostReadScope = getDraftPostReadScope(
      c.req.method,
      c.req.path,
      c.req.query("status")
    );

    if (draftPostReadScope) {
      if (c.get("apiKeyType") !== "private") {
        return c.json(
          {
            error: "Forbidden",
            message: "Reading draft or all posts requires a private API key.",
          },
          403
        );
      }

      if (!hasScope(scopes, draftPostReadScope)) {
        return c.json(
          {
            error: "Forbidden",
            message: `API key missing required scope: ${draftPostReadScope}`,
          },
          403
        );
      }

      await next();
      return;
    }

    const requiredScope = getRequiredScope(c.req.method, c.req.path);
    if (requiredScope && !hasScope(scopes, requiredScope)) {
      return c.json(
        {
          error: "Forbidden",
          message: `API key missing required scope: ${requiredScope}`,
        },
        403
      );
    }

    await next();
  };
