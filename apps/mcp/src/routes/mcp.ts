import { createMcpHandler } from "agents/mcp";
import { Hono } from "hono";
import { getApiKey } from "@/lib/auth";
import { MARBLE_API_BASE_URL } from "@/lib/constants";
import { createServer } from "@/server";
import type { Env } from "@/types";

export const mcpRoute = new Hono<{ Bindings: Env }>();

mcpRoute.all("/", async (c) => {
  let apiKey: string;
  try {
    apiKey = getApiKey(c.req.raw);
  } catch (error) {
    return c.json(
      {
        error: "Unauthorized",
        message:
          error instanceof Error
            ? error.message
            : "Missing or invalid Marble API key.",
      },
      401
    );
  }

  const server = createServer(MARBLE_API_BASE_URL, apiKey);
  const handler = createMcpHandler(server, { route: "/mcp" });

  return handler(c.req.raw, c.env, c.executionCtx);
});
