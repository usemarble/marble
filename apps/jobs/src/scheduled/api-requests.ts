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

  const result = await db.usageEvent.deleteMany({
    where: {
      type: "api_request",
      createdAt: { lt: cutoff },
    },
  });

  if (result.count > 0) {
    console.log(`[Cleanup] Deleted ${result.count} stale API request row(s)`);
  }
}
