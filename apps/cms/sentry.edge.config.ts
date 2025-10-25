// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import { init as SentryInit } from "@sentry/nextjs";

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
