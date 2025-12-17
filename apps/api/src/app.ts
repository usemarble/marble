import { Hono } from "hono";
import { trimTrailingSlash } from "hono/trailing-slash";
import { ROUTES } from "./lib/constants";
import { analytics } from "./middleware/analytics";
import { authorization } from "./middleware/authorization";
import { cache } from "./middleware/cache";
import { keyAnalytics } from "./middleware/key-analytics";
import { keyAuthorization } from "./middleware/key-authorization";
import { ratelimit } from "./middleware/ratelimit";
import authorsRoutes from "./routes/authors";
import categoriesRoutes from "./routes/categories";
import postsRoutes from "./routes/posts";
import tagsRoutes from "./routes/tags";
import type { ApiKeyApp, Env } from "./types/env";

const app = new Hono<{ Bindings: Env }>();

// Global middleware
app.use("*", cache());
app.use(trimTrailingSlash());

// ============================================
// API Key Routes (/v1/posts, /v1/tags, etc.)
// Matched when first segment after /v1/ is a known resource
// ============================================
const apiKeyV1 = new Hono<ApiKeyApp>();
apiKeyV1.use("*", ratelimit("apiKey"));
apiKeyV1.use("*", keyAuthorization());
apiKeyV1.use("*", keyAnalytics());

apiKeyV1.route("/posts", postsRoutes);
apiKeyV1.route("/categories", categoriesRoutes);
apiKeyV1.route("/tags", tagsRoutes);
apiKeyV1.route("/authors", authorsRoutes);

// ============================================
// Legacy Workspace ID Routes (/v1/:workspaceId/*)
// Will eventually be deprecated
// ============================================
const legacyV1 = new Hono<{ Bindings: Env }>();
legacyV1.use("/:workspaceId/*", ratelimit("workspace"));
legacyV1.use("/:workspaceId/*", authorization());
legacyV1.use("/:workspaceId/*", analytics());

legacyV1.route("/:workspaceId/tags", tagsRoutes);
legacyV1.route("/:workspaceId/categories", categoriesRoutes);
legacyV1.route("/:workspaceId/posts", postsRoutes);
legacyV1.route("/:workspaceId/authors", authorsRoutes);

// ============================================
// Route dispatcher - checks the path pattern to determine handler
// ============================================
app.use("/v1/*", async (c) => {
  const path = c.req.path;
  // Extract the first segment after /v1/
  // e.g., /v1/posts -> "posts", /v1/abc123/posts -> "abc123"
  const segments = path.replace("/v1/", "").split("/");
  const firstSegment = segments[0];

  // Rewrite path (strip /v1 prefix) for sub-routers
  const newPath = path.replace("/v1", "");
  const newUrl = new URL(c.req.url);
  newUrl.pathname = newPath;
  const newRequest = new Request(newUrl.toString(), c.req.raw);

  // If the first segment is a known resource, use API key routes
  if (ROUTES.includes(firstSegment)) {
    return apiKeyV1.fetch(newRequest, c.env, c.executionCtx);
  }

  // Otherwise, treat first segment as workspaceId, use legacy routes
  return legacyV1.fetch(newRequest, c.env, c.executionCtx);
});

// Redirect non-versioned routes to v1
app.use("/:workspaceId/*", async (c, next) => {
  const path = c.req.path;
  const workspaceId = c.req.param("workspaceId");
  if (path.startsWith("/v1/") || path === "/" || path === "/status") {
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

export default app;
