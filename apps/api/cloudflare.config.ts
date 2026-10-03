import {
  appUrl,
  baseWorker,
  dataBindings,
  queues,
  resolveMode,
  storagePublicUrl,
  workerName,
} from "@marble/cf-config";
import type { EventMessage, TaskMessage } from "@marble/events";
import { bindings, defineConfig } from "cf/config";

export default defineConfig((ctx) => {
  const mode = resolveMode(ctx.mode);
  const queue = queues(mode);
  const publicUrl = storagePublicUrl(mode);
  const dashboardOrigin = appUrl(mode);
  const authUrl = {
    production: "https://api.marblecms.com",
    staging: "https://api-staging.marblecms.com",
    dev: "http://localhost:8787",
  }[mode];

  return {
    worker: {
      ...baseWorker,
      name: workerName("marble-api", mode),
      // Production's api.marblecms.com is managed in the dashboard; only the
      // staging domain is declared here.
      ...(mode === "staging" && { domains: ["api-staging.marblecms.com"] }),
      env: {
        ...dataBindings(mode),
        EVENT_QUEUE: bindings.queue<EventMessage>({ name: queue.events }),
        TASK_QUEUE: bindings.queue<TaskMessage>({ name: queue.tasks }),
        STORAGE_PUBLIC_URL: bindings.text(
          publicUrl ?? "https://cdn.marblecms.com"
        ),
        MODE: bindings.text(mode),
        APP_URL: bindings.text(dashboardOrigin),
        BETTER_AUTH_URL: bindings.text(authUrl),
        AUTH_COOKIE_DOMAIN: bindings.text(
          mode === "dev" ? "" : ".marblecms.com"
        ),
        AUTH_COOKIE_PREFIX: bindings.text(workerName("marble", mode)),
        POLAR_SERVER: bindings.text(
          mode === "production" ? "production" : "sandbox"
        ),
        // cf deploy deletes any secret not declared here.
        BETTER_AUTH_SECRET: bindings.secret(),
        GOOGLE_CLIENT_ID: bindings.secret(),
        GOOGLE_CLIENT_SECRET: bindings.secret(),
        GITHUB_ID: bindings.secret(),
        GITHUB_SECRET: bindings.secret(),
        POLAR_ACCESS_TOKEN: bindings.secret(),
        POLAR_WEBHOOK_SECRET: bindings.secret(),
        POLAR_SUCCESS_URL: bindings.secret(),
        POLAR_HOBBY_MONTHLY_PRODUCT_ID: bindings.secret(),
        POLAR_HOBBY_YEARLY_PRODUCT_ID: bindings.secret(),
        POLAR_PRO_MONTHLY_PRODUCT_ID: bindings.secret(),
        POLAR_PRO_YEARLY_PRODUCT_ID: bindings.secret(),
        REDIS_URL: bindings.secret(),
        REDIS_TOKEN: bindings.secret(),
        RESEND_API_KEY: bindings.secret(),
        DATABUDDY_API_KEY: bindings.secret(),
        DATABUDDY_CLIENT_ID: bindings.secret(),
        DATABUDDY_WEB_CLIENT_ID: bindings.secret(),
        SYSTEM_SECRET: bindings.secret(),
      },
    },
  };
});
