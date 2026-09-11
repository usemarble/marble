import { usageEvent } from "@marble/drizzle/schema";
import { and, eq, lt } from "drizzle-orm";
import {
  API_REQUEST_RETENTION_DAYS,
  MILLISECONDS_IN_DAY,
} from "@/lib/constants";
import type { DbClient } from "@/lib/db";

export async function cleanupStaleApiRequests({
  db,
  now,
}: {
  db: DbClient;
  now: Date;
}) {
  const cutoff = new Date(
    now.getTime() - API_REQUEST_RETENTION_DAYS * MILLISECONDS_IN_DAY
  );

  const deleted = await db
    .delete(usageEvent)
    .where(
      and(eq(usageEvent.type, "api_request"), lt(usageEvent.createdAt, cutoff))
    )
    .returning({ id: usageEvent.id });

  if (deleted.length > 0) {
    console.log(`[Cleanup] Deleted ${deleted.length} stale API request row(s)`);
  }
}
