// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import {
  captureRouterTransitionStart,
  init as SentryInit,
} from "@sentry/nextjs";

if (process.env.NEXT_PUBLIC_SENTRY_DSN_URL) {
  SentryInit({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN_URL,

    // Enable logs to be sent to Sentry
    enableLogs: true,

    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.5 : 0,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,
  });
} else {
  console.warn(
    "NEXT_PUBLIC_SENTRY_DSN_URL is not set. Sentry will not be initialized for server runtime."
  );
}

export const onRouterTransitionStart = captureRouterTransitionStart;
