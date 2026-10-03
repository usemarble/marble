import {
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
        ...(publicUrl && { STORAGE_PUBLIC_URL: bindings.text(publicUrl) }),
        POLAR_SERVER: bindings.text(
          mode === "production" ? "production" : "sandbox"
        ),
        // cf deploy deletes any secret not declared here.
        POLAR_ACCESS_TOKEN: bindings.secret(),
        REDIS_URL: bindings.secret(),
        REDIS_TOKEN: bindings.secret(),
        RESEND_API_KEY: bindings.secret(),
        SYSTEM_SECRET: bindings.secret(),
      },
    },
  };
});
