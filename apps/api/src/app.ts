import { OpenAPIHono } from "@hono/zod-openapi";
import { Hono } from "hono";
import { trimTrailingSlash } from "hono/trailing-slash";
import { ROUTES } from "./lib/constants";
import { analytics } from "./middleware/analytics";
import { authorization } from "./middleware/authorization";
import { cache } from "./middleware/cache";
import { keyAnalytics } from "./middleware/key-analytics";
import { keyAuthorization } from "./middleware/key-authorization";
import { ratelimit } from "./middleware/ratelimit";
import { systemAuth } from "./middleware/system";
import authorsRoutes from "./routes/authors";
import cacheRoutes from "./routes/cache";
import categoriesRoutes from "./routes/categories";
import invalidateRoutes from "./routes/invalidate";
import postsRoutes from "./routes/posts";
import tagsRoutes from "./routes/tags";
import type { ApiKeyApp, Env } from "./types/env";

const app = new OpenAPIHono<{ Bindings: Env }>();

// Global middleware
app.use("*", cache());
app.use(trimTrailingSlash());

// ============================================
// Internal System Routes (no API key, no analytics)
// ============================================
app.use("/cache/invalidate", systemAuth());
app.route("/cache/invalidate", cacheRoutes);

// ============================================
// API Key Routes (/v1/posts, /v1/tags, etc.)
// Using OpenAPIHono to properly merge specs
// ============================================
const apiKeyV1 = new OpenAPIHono<ApiKeyApp>();
apiKeyV1.use("*", ratelimit("apiKey"));
apiKeyV1.use("*", keyAuthorization());
apiKeyV1.use("*", keyAnalytics());

// Mount routes with proper OpenAPIHono to enable spec merging
apiKeyV1.route("/posts", postsRoutes);
apiKeyV1.route("/categories", categoriesRoutes);
apiKeyV1.route("/tags", tagsRoutes);
apiKeyV1.route("/authors", authorsRoutes);
apiKeyV1.route("/cache/invalidate", invalidateRoutes);

// Mount apiKeyV1 under /v1 to automatically merge OpenAPI specs
app.route("/v1", apiKeyV1);

// ============================================
// Legacy Workspace ID Routes (/v1/:workspaceId/*)
// Using standard Hono since these are deprecated and don't need to be in the spec
// ============================================
const legacyV1 = new Hono<{ Bindings: Env }>();
legacyV1.use("/:workspaceId/*", ratelimit("workspace"));
legacyV1.use("/:workspaceId/*", authorization());
legacyV1.use("/:workspaceId/*", analytics());

legacyV1.route("/:workspaceId/tags", tagsRoutes);
legacyV1.route("/:workspaceId/categories", categoriesRoutes);
legacyV1.route("/:workspaceId/posts", postsRoutes);
legacyV1.route("/:workspaceId/authors", authorsRoutes);

// Mount legacy routes - use custom middleware to handle the dispatch
app.use("/v1/:workspaceId/*", async (c) => {
  const path = c.req.path;
  const workspaceId = c.req.param("workspaceId");

  // Check if this is a legacy workspace route (workspaceId is not a known resource)
  if (!ROUTES.includes(workspaceId)) {
    // Rewrite path (strip /v1 prefix) for legacy router
    const newPath = path.replace("/v1", "");
    const newUrl = new URL(c.req.url);
    newUrl.pathname = newPath;
    const newRequest = new Request(newUrl.toString(), c.req.raw);
    return legacyV1.fetch(newRequest, c.env, c.executionCtx);
  }

  // If workspaceId is actually a resource name, let the route fall through to apiKeyV1
  return c.notFound();
});

// Redirect non-versioned routes to v1
app.use("/:workspaceId/*", async (c, next) => {
  const path = c.req.path;
  const workspaceId = c.req.param("workspaceId");
  if (
    path.startsWith("/v1/") ||
    path === "/" ||
    path === "/status" ||
    path === "/doc"
  ) {
    return next();
  }

  const isWorkspaceRoute = ROUTES.some(
    (route) =>
      path === `/${workspaceId}/${route}` ||
      path.startsWith(`/${workspaceId}/${route}/`)
  );

  if (isWorkspaceRoute) {
    const url = new URL(c.req.url);
    url.pathname = `/v1${path}`;
    return Response.redirect(url.toString(), 308);
  }
  return next();
});

// Redirect non-versioned API routes to v1 (e.g., /posts -> /v1/posts)
app.use("/*", async (c, next) => {
  const path = c.req.path;
  const firstSegment = path.split("/").filter(Boolean)[0];

  if (firstSegment && ROUTES.includes(firstSegment)) {
    const url = new URL(c.req.url);
    url.pathname = `/v1${path}`;
    return Response.redirect(url.toString(), 308);
  }
  return next();
});

// Health
app.get("/", (c) => c.text("Hello from marble"));
app.get("/status", (c) => c.json({ status: "ok" }));

// ============================================
// OpenAPI Documentation (public, no auth)
// ============================================
app.doc("/doc", {
  openapi: "3.1.0",
  info: {
    title: "Marble API",
    version: "1.0.0",
    description:
      "Headless CMS API for content delivery. Use your API key in the Authorization header as a Bearer token.",
  },
  servers: [{ url: "https://api.marblecms.com", description: "Production" }],
  security: [{ bearerAuth: [] }],
});

// Register security scheme
app.openAPIRegistry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "API Key",
  description: "Your Marble API key",
});

export default app;
