// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import {
  captureRouterTransitionStart,
  init as SentryInit,
} from "@sentry/nextjs";

SentryInit({
  dsn: process.env.SENTRY_DSN_URL,
  // Enable logs to be sent to Sentry
  enableLogs: true,

  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.3 : 0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});

export const onRouterTransitionStart = captureRouterTransitionStart;
