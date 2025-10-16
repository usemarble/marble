// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import { init as SentryInit } from "@sentry/nextjs";

SentryInit({
  dsn: process.env.SENTRY_DSN_URL,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.5 : 0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});
