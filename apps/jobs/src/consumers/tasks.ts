import { createDbClient } from "../lib/db";
import { runExport } from "../lib/export";
import { runImportCreate, runImportProcess } from "../lib/import";
import type { Env, TaskMessage } from "../types/env";

/**
 * Consumer for the shared `marble-tasks` queue (max_batch_size: 1).
 *
 * Both exports and imports flow through here, discriminated by `message.body.type`.
 * The DB job row (ExportJob / ImportJob) is the source of truth; the queue is
 * only the trigger. The actual work lives in `lib/export.ts` and `lib/import.ts`; this
 * stays a thin dispatcher. Handlers must be idempotent because a retry
 * redelivers the same message.
 */
export async function handleTaskQueue(
  batch: MessageBatch<TaskMessage>,
  env: Env
) {
  const db = createDbClient(env);

  for (const message of batch.messages) {
    const body = message.body;

    try {
      switch (body.type) {
        case "export.process":
          await runExport(db, env, body.jobId);
          break;
        case "import.process":
          await runImportProcess(db, env, body.jobId);
          break;
        case "import.create":
          await runImportCreate(db, env, body.jobId);
          break;
        default:
          console.error("[Tasks] Unknown task type:", JSON.stringify(body));
      }

      message.ack();
    } catch (error) {
      console.error(
        `[Tasks] Failed to process ${body.type} ${body.jobId}:`,
        error instanceof Error ? error.message : error
      );
      message.retry();
    }
  }
}
