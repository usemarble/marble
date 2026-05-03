import { Hono } from "hono";
import { trimTrailingSlash } from "hono/trailing-slash";
import { mcpRoute } from "./routes/mcp";
import type { Env } from "./types";

const app = new Hono<{ Bindings: Env }>();

app.use(trimTrailingSlash());

app.get("/", (c) =>
  c.json({
    name: "Marble MCP",
    status: "ok",
    endpoint: "/mcp",
  })
);

app.get("/health", (c) => c.json({ status: "ok" }));
app.route("/mcp", mcpRoute);

export default app;
