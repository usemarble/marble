import type { Context } from "@marble/api/context";
import { appRouter } from "@marble/api/routers";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { ORPCError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { SimpleCsrfProtectionHandlerPlugin } from "@orpc/server/plugins";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";

/**
 * Tags the wide event with the procedure and logs the errors that are ours
 * (bugs and 5xx), not the 4xx a client caused. Each handler gets its own array
 * because oRPC plugins push their interceptors onto the one they are given.
 */
async function logProcedure({
  context,
  path,
  next,
}: {
  context: Context;
  path: readonly string[];
  next: () => Promise<unknown>;
}) {
  context.log.set({ rpc: { procedure: path.join(".") } });
  try {
    return await next();
  } catch (error) {
    if (!(error instanceof ORPCError) || error.status >= 500) {
      context.log.error(
        error instanceof Error ? error : new Error(String(error))
      );
    }
    throw error;
  }
}

/**
 * The dashboard's RPC endpoint, mounted at `/rpc`. Requests must carry the
 * `x-csrf-token` header the client's CSRF plugin adds: it forces a CORS
 * preflight, which only the dashboard origin passes, so a form or a page on
 * another origin can't ride the session cookie into a mutation.
 */
export const rpcHandler = new RPCHandler<Context>(appRouter, {
  plugins: [new SimpleCsrfProtectionHandlerPlugin()],
  clientInterceptors: [logProcedure],
});

/**
 * Development-only API reference for the dashboard router. Serves
 * `/internal/reference` and `/internal/openapi.json`, plus the procedures at
 * their REST-shaped paths so "try it" works. Never mounted outside dev.
 */
export const referenceHandler = new OpenAPIHandler<Context>(appRouter, {
  clientInterceptors: [logProcedure],
  plugins: [
    new OpenAPIReferencePlugin({
      schemaConverters: [new ZodToJsonSchemaConverter()],
      docsPath: "/reference",
      specPath: "/openapi.json",
      docsTitle: "Marble dashboard API",
      specGenerateOptions: {
        info: {
          title: "Marble dashboard API",
          version: "0.0.0",
          description:
            "The router behind the dashboard. Internal: not the public /v1 API.",
        },
      },
    }),
  ],
});
