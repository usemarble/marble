import type { Context, ServiceContext } from "@marble/api/context";
import { createAuth } from "@marble/auth";
import { identifyUser } from "evlog/better-auth";
import type { Context as HonoContext } from "hono";
import type { Env } from "@/types/env";
import type { DbVariables } from "./db";
import type { LogVariables } from "./logger";

type RequestContext = HonoContext<{
  Bindings: Env;
  Variables: DbVariables & LogVariables;
}>;

/**
 * The context services run with, built from the request. `defer` keeps work
 * alive after the response, and uses the request's Hyperdrive client, which is
 * deliberately never closed.
 */
export function serviceContext(c: RequestContext): ServiceContext {
  return {
    db: c.get("db"),
    log: c.get("log"),
    env: c.env,
    queues: { events: c.env.EVENT_QUEUE, tasks: c.env.TASK_QUEUE },
    defer: (work) => c.executionCtx.waitUntil(work),
  };
}

/**
 * The oRPC context for `/rpc` (and later `/ai`): the service context plus the
 * caller's session. This is the only place the session is looked up, so `/v1`
 * API-key traffic never pays for it. A failing lookup throws instead of
 * becoming an anonymous request, which would sign the user out of the
 * dashboard over a database blip.
 */
export async function createRequestContext(
  c: RequestContext
): Promise<Context> {
  const base = serviceContext(c);
  const auth = createAuth({ db: base.db, env: c.env });
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (session) {
    identifyUser(base.log, session, {
      maskEmail: true,
      session: false,
      fields: ["id", "email"],
    });
  }

  return {
    ...base,
    session,
    // Cloudflare sets this and a client can't override it. x-forwarded-for
    // can be forged, so it is not used.
    clientIp: c.req.header("cf-connecting-ip") ?? null,
  };
}
