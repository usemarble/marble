import {
  baseWorker,
  dataBindings,
  queues,
  resolveMode,
  workerName,
} from "@marble/cf-config";
import type { EventMessage, TaskMessage } from "@marble/events";
import { bindings, defineConfig } from "cf/config";

export default defineConfig((ctx) => {
  const mode = resolveMode(ctx.mode);

  return {
    worker: {
      ...baseWorker,
      name: workerName("marble-api", mode),
      env: {
        ...dataBindings(mode),
        EVENT_QUEUE: bindings.queue<EventMessage>({ name: queues.events }),
        TASK_QUEUE: bindings.queue<TaskMessage>({ name: queues.tasks }),
        POLAR_SERVER: bindings.text(mode === "dev" ? "sandbox" : "production"),
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
