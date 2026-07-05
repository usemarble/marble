import { Hono } from "hono";
import { trimTrailingSlash } from "hono/trailing-slash";
import { homeRoute } from "./routes/home";
import { mcpRoute } from "./routes/mcp";
import type { Env } from "./types";

const app = new Hono<{ Bindings: Env }>();

const CACHE_CONTROL =
  "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800";

const serverCard = {
  url: "https://mcp.marblecms.com/mcp",
  authentication: {
    type: "api_key",
    headers: ["Mcp-Marble-Api-Key", "X-Marble-Api-Key", "Authorization"],
  },
};

app.use(trimTrailingSlash());

app.route("/", homeRoute);
app.get("/health", (c) => c.json({ status: "ok" }));
app.get("/.well-known/mcp/server-card.json", (c) => {
  c.header("Cache-Control", CACHE_CONTROL);
  return c.json(serverCard);
});
app.route("/mcp", mcpRoute);

export default app;
