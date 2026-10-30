import { SIGNUP_TIMEZONE_COOKIE } from "@marble/utils/workspace";
import { env } from "@/env";

// Matches how long Better Auth keeps an OAuth state, the longest a sign-up runs.
const MAX_AGE_SECONDS = 10 * 60;

/**
 * Tells the API Worker this browser's timezone for the workspace it creates at
 * sign-up. Lax lets the cookie through on the OAuth provider's redirect back.
 */
export function saveBrowserTimezone() {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const domain = env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN;
  // biome-ignore lint/suspicious/noDocumentCookie: <>
  document.cookie = [
    `${SIGNUP_TIMEZONE_COOKIE}=${encodeURIComponent(timezone)}`,
    `Max-Age=${MAX_AGE_SECONDS}`,
    "Path=/api/auth",
    "SameSite=Lax",
    ...(domain ? [`Domain=${domain}`] : []),
    ...(window.location.protocol === "https:" ? ["Secure"] : []),
  ].join("; ");
}
