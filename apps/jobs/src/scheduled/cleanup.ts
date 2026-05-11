import type { Env } from "../types/env";

export async function handleCleanup(
  _event: ScheduledEvent,
  _env: Env,
  _ctx: ExecutionContext
) {
  console.log(
    `[Cleanup] Running scheduled cleanup at ${new Date().toISOString()}`
  );

  // TODO: Delete old usage events, aggregate analytics, etc.
}
