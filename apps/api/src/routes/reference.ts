import { createMiddleware } from "hono/factory";
import { createRequestContext } from "@/lib/context";
import type { DbVariables } from "@/lib/db";
import { createDbClient } from "@/lib/db";
import type { LogVariables } from "@/lib/logger";
import { referenceHandler } from "@/lib/rpc";
import type { Env } from "@/types/env";

/**
 * Serves the dashboard router's OpenAPI reference at `/internal/reference` and
 * `/internal/openapi.json`. Development only: in any other mode it steps aside
 * without touching the request, so the internal relay routes behind it still
 * match.
 */
export const devReference = createMiddleware<{
  Bindings: Env;
  Variables: DbVariables & LogVariables;
}>(async (c, next) => {
  if (c.env.MODE !== "dev") {
    return next();
  }

  if (!c.get("db")) {
    c.set("db", await createDbClient(c.env));
  }

  const result = await referenceHandler.handle(c.req.raw, {
    prefix: "/internal",
    context: await createRequestContext(c),
  });
  if (result.matched) {
    return result.response;
  }
  return next();
});
