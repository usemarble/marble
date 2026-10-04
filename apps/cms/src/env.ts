import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * The CMS holds no secrets and no database access, so these public values are
 * all it reads. `next.config.ts` imports this file, which validates them when
 * `next dev` or `next build` starts instead of at the first request.
 *
 * Next only inlines `process.env.NEXT_PUBLIC_*` when it is written out in full,
 * hence the explicit `runtimeEnv`.
 */
export const env = createEnv({
  client: {
    /** The API Worker's origin: `/rpc`, `/api/auth` and `/ai`. */
    NEXT_PUBLIC_API_URL: z.url(),
    /** This dashboard's own origin. */
    NEXT_PUBLIC_APP_URL: z.url(),
    /** The marketing site. */
    NEXT_PUBLIC_SITE_URL: z.url().default("https://marblecms.com"),
    /** Analytics is off when these aren't set (local development). */
    NEXT_PUBLIC_DATABUDDY_CLIENT_ID: z.string().min(1).optional(),
    NEXT_PUBLIC_DATABUDDY_WEB_CLIENT_ID: z.string().min(1).optional(),
  },
  runtimeEnv: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_DATABUDDY_CLIENT_ID:
      process.env.NEXT_PUBLIC_DATABUDDY_CLIENT_ID,
    NEXT_PUBLIC_DATABUDDY_WEB_CLIENT_ID:
      process.env.NEXT_PUBLIC_DATABUDDY_WEB_CLIENT_ID,
  },
  emptyStringAsUndefined: true,
});
