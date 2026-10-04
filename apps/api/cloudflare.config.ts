import {
  apiUrl,
  appUrl,
  baseWorker,
  dataBindings,
  queues,
  resolveMode,
  storageBucketName,
  storagePublicUrl,
  workerName,
} from "@marble/cf-config";
import type { EventMessage, TaskMessage } from "@marble/events";
import { bindings, defineConfig } from "cf/config";

/**
 * Polar product IDs aren't secret. Staging and dev share the sandbox
 * organization's products.
 */
const sandboxProducts = {
  hobbyMonthly: "e98c76bc-b8b5-4f75-8760-a604ecc0af88",
  hobbyYearly: "3c676289-33e0-4043-a4a5-9e9fc19751a2",
  proMonthly: "fc74a674-7e10-49bd-9c36-a85d66d8148f",
  proYearly: "713a1ba9-bb0b-4afd-bdd0-2be3d2b61b39",
};
const polarProducts = {
  production: {
    hobbyMonthly: "1937233e-34dc-4c5c-ac90-4e563ec0bede",
    hobbyYearly: "43141d97-d052-4c18-af81-410ab6b01fd0",
    proMonthly: "39f66f1d-2d68-4683-a226-6758aae8b605",
    proYearly: "dde9531b-c321-474e-a6c3-a69ce45dd940",
  },
  staging: sandboxProducts,
  dev: sandboxProducts,
};

export default defineConfig((ctx) => {
  const mode = resolveMode(ctx.mode);
  const queue = queues(mode);
  const publicUrl = storagePublicUrl(mode);
  const dashboardOrigin = appUrl(mode);
  const products = polarProducts[mode];

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
        R2_S3_ENDPOINT: bindings.text(
          "https://3fade0cee31eae101fc646319ce3b7ef.r2.cloudflarestorage.com"
        ),
        R2_BUCKET_NAME: bindings.text(storageBucketName(mode)),
        MODE: bindings.text(mode),
        APP_URL: bindings.text(dashboardOrigin),
        BETTER_AUTH_URL: bindings.text(apiUrl(mode)),
        AUTH_COOKIE_DOMAIN: bindings.text(
          mode === "dev" ? "" : ".marblecms.com"
        ),
        AUTH_COOKIE_PREFIX: bindings.text(workerName("marble", mode)),
        POLAR_SERVER: bindings.text(
          mode === "production" ? "production" : "sandbox"
        ),
        POLAR_SUCCESS_URL: bindings.text(
          `${dashboardOrigin}/billing/success?checkout_id={CHECKOUT_ID}`
        ),
        POLAR_HOBBY_MONTHLY_PRODUCT_ID: bindings.text(products.hobbyMonthly),
        POLAR_HOBBY_YEARLY_PRODUCT_ID: bindings.text(products.hobbyYearly),
        POLAR_PRO_MONTHLY_PRODUCT_ID: bindings.text(products.proMonthly),
        POLAR_PRO_YEARLY_PRODUCT_ID: bindings.text(products.proYearly),
        // Registration analytics only run in production.
        DATABUDDY_CLIENT_ID: bindings.text(
          mode === "production" ? "CG1SRcfYdIQoCeBrPpbJ_" : ""
        ),
        DATABUDDY_WEB_CLIENT_ID: bindings.text(
          mode === "production" ? "Dq_1D8IsZscrCY2rNneFZ" : ""
        ),
        // cf deploy deletes any secret not declared here.
        AI_GATEWAY_API_KEY: bindings.secret(),
        BETTER_AUTH_SECRET: bindings.secret(),
        R2_ACCESS_KEY_ID: bindings.secret(),
        R2_SECRET_ACCESS_KEY: bindings.secret(),
        GOOGLE_CLIENT_ID: bindings.secret(),
        GOOGLE_CLIENT_SECRET: bindings.secret(),
        GITHUB_ID: bindings.secret(),
        GITHUB_SECRET: bindings.secret(),
        POLAR_ACCESS_TOKEN: bindings.secret(),
        POLAR_WEBHOOK_SECRET: bindings.secret(),
        REDIS_URL: bindings.secret(),
        REDIS_TOKEN: bindings.secret(),
        RESEND_API_KEY: bindings.secret(),
        ...(mode === "production" && {
          DATABUDDY_API_KEY: bindings.secret(),
        }),
      },
    },
  };
});
