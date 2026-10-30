import {
  SIGNUP_TIMEZONE_COOKIE,
  timezoneSchema,
} from "@marble/utils/workspace";
import { readCookie } from "./analytics";

const DEFAULT_TIMEZONE = "Europe/London";

function parseTimezone(candidate: unknown) {
  if (typeof candidate !== "string") {
    return;
  }

  try {
    // Firefox and Cloudflare can report Asia/Kolkata where V8 only lists
    // Asia/Calcutta, so the schema checks the runtime's own spelling.
    const { timeZone } = new Intl.DateTimeFormat("en", {
      timeZone: candidate,
    }).resolvedOptions();
    return timezoneSchema.safeParse({ timezone: timeZone }).data?.timezone;
  } catch {
    return;
  }
}

export function resolveSignupTimezone({
  cookieHeader,
  cloudflareTimezone,
}: {
  cookieHeader?: string | null;
  cloudflareTimezone?: unknown;
}) {
  return (
    parseTimezone(readCookie(cookieHeader, SIGNUP_TIMEZONE_COOKIE)) ??
    parseTimezone(cloudflareTimezone) ??
    DEFAULT_TIMEZONE
  );
}
