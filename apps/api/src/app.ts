import { Hono } from "hono";
import { trimTrailingSlash } from "hono/trailing-slash";
import { ratelimit } from "./middleware/ratelimit";
import authorsRoutes from "./routes/authors";
import categoriesRoutes from "./routes/categories";
import postsRoutes from "./routes/posts";
import tagsRoutes from "./routes/tags";
import type { Env } from "./types/env";

const app = new Hono<{ Bindings: Env }>();
const v1 = new Hono<{ Bindings: Env }>();

// Global Middleware
app.use("*", ratelimit());
app.use(trimTrailingSlash());

app.use("*", async (c, next) => {
  await next();
  const cacheControl = c.res.headers.get("Cache-Control");
  c.header(
    "Cache-Control",
    cacheControl
      ? `${cacheControl}, stale-if-error=3600`
      : "stale-if-error=3600",
  );
});

// Workspace redirect logic
app.use("/:workspaceId/*", async (c, next) => {
  const path = c.req.path;
  const workspaceId = c.req.param("workspaceId");
  if (path.startsWith("/v1/") || path === "/" || path === "/status")
    return next();

  const workspaceRoutes = ["/tags", "/categories", "/posts", "/authors"];
  const isWorkspaceRoute = workspaceRoutes.some(
    (route) =>
      path === `/${workspaceId}${route}` ||
      path.startsWith(`/${workspaceId}${route}/`),
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

app.route("/v1", v1);

export default app;
