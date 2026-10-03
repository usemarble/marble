import type { AppRouterClient } from "@marble/api/routers";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { SimpleCsrfProtectionLinkPlugin } from "@orpc/client/plugins";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";

/**
 * The dashboard's typed client for the API Worker's `/rpc` router. Browser-only:
 * server components never fetch data (they would have to forward cookies and add
 * a Vercel to Worker hop to every render), so this is only used from client
 * components, through the query utilities below.
 *
 * The session cookie lives on the shared parent domain, so requests include
 * credentials; the CSRF plugin adds the header the Worker requires.
 */
const link = new RPCLink({
  url: `${process.env.NEXT_PUBLIC_API_URL}/rpc`,
  plugins: [new SimpleCsrfProtectionLinkPlugin()],
  fetch: (request, init) =>
    globalThis.fetch(request, { ...init, credentials: "include" }),
});

export const client: AppRouterClient = createORPCClient(link);

/** `orpc.<resource>.<procedure>.queryOptions({ input })` / `.mutationOptions()` / `.key()`. */
export const orpc = createTanstackQueryUtils(client);
