import { createMcpHandler } from "agents/mcp";
import { Hono } from "hono";
import { getApiKey } from "@/lib/auth";
import { DEFAULT_API_BASE_URL } from "@/lib/constants";
import { createServer } from "@/server";
import type { Env } from "@/types";

export const mcpRoute = new Hono<{ Bindings: Env }>();

mcpRoute.all("/", async (c) => {
  const apiKey = getApiKey(c.req.raw);
  const apiBaseUrl = c.env.MARBLE_API_BASE_URL ?? DEFAULT_API_BASE_URL;
  const server = createServer(apiBaseUrl, apiKey);
  const handler = createMcpHandler(server, { route: "/mcp" });

  return handler(c.req.raw, c.env, c.executionCtx);
});
