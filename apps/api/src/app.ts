import { Hono } from "hono";
import { trimTrailingSlash } from "hono/trailing-slash";
import { analytics } from "./middleware/analytics";
import { ratelimit } from "./middleware/ratelimit";
import authorsRoutes from "./routes/v1/authors";
import categoriesRoutes from "./routes/v1/categories";
import postsRoutes from "./routes/v1/posts";
import tagsRoutes from "./routes/v1/tags";
import authorsV2Routes from "./routes/v2/authors";
import categoriesV2Routes from "./routes/v2/categories";
import postsV2Routes from "./routes/v2/posts";
import tagsV2Routes from "./routes/v2/tags";
import type { Env } from "./types/env";

const app = new Hono<{ Bindings: Env }>();
const v1 = new Hono<{ Bindings: Env }>();
const v2 = new Hono<{ Bindings: Env }>();

const staleTime = 3600;

// Global Middleware
app.use("*", async (c, next) => {
  await next();
  const method = c.req.method;
  // Make sure we only set the Cache-Control header for GET and HEAD requests
  // and only if the response status is in the 2xx or 3xx range.
  if (method === "GET" || method === "HEAD") {
    const status = c.res.status ?? 200;
    if (status >= 200 && status < 400) {
      const cc = c.res.headers.get("Cache-Control") ?? "";
      const hasNoStore = /\bno-store\b/i.test(cc);
      const hasSIE = /\bstale-if-error\s*=\s*\d+\b/i.test(cc);
      // If we already set a cache control header with no-store or stale-if-error, skip setting it again
      if (!hasNoStore && !hasSIE) {
        const value = cc
          ? `${cc}, stale-if-error=${staleTime}`
          : `stale-if-error=${staleTime}`;
        c.header("Cache-Control", value);
      }
    }
  }
});

app.use("/v1/:workspaceId/*", ratelimit());
app.use("/v1/:workspaceId/*", analytics());

app.use("/v2/:workspaceId/*", ratelimit());
app.use("/v2/:workspaceId/*", analytics());

app.use(trimTrailingSlash());

// Workspace redirect logic
app.use("/:workspaceId/*", async (c, next) => {
  const path = c.req.path;
  const workspaceId = c.req.param("workspaceId");
  if (path.startsWith("/v1/") || path === "/" || path === "/status") {
    return next();
  }

  const workspaceRoutes = ["/tags", "/categories", "/posts", "/authors"];
  const isWorkspaceRoute = workspaceRoutes.some(
    (route) =>
      path === `/${workspaceId}${route}` ||
      path.startsWith(`/${workspaceId}${route}/`)
  );

  if (isWorkspaceRoute) {
    const url = new URL(c.req.url);
    url.pathname = `/v1${path}`;
    return Response.redirect(url.toString(), 308);
  }
  return next();
});

// Health
app.get("/", (c) => c.text("Hello from marble"));
app.get("/status", (c) => c.json({ status: "ok" }));

// Mount routes
v1.route("/:workspaceId/tags", tagsRoutes);
v1.route("/:workspaceId/categories", categoriesRoutes);
v1.route("/:workspaceId/posts", postsRoutes);
v1.route("/:workspaceId/authors", authorsRoutes);

v2.route("/:workspaceId/tags", tagsV2Routes);
v2.route("/:workspaceId/categories", categoriesV2Routes);
v2.route("/:workspaceId/posts", postsV2Routes);
v2.route("/:workspaceId/authors", authorsV2Routes);

app.route("/v1", v1);
app.route("/v2", v2);

export default app;
