import type { DbTransaction, ServiceContext } from "../context";
import { invalidateCache } from "../services/cache";
import {
  type EventOptions,
  insertEvent,
  publishEvents,
} from "../services/events";
import type { CacheResource } from "./cache";

/** What a write service can do inside `transact`. */
export interface UnitOfWork {
  tx: DbTransaction;
  /** Writes the outbox row in this transaction; it is sent after commit. */
  emitEvent(options: EventOptions): Promise<void>;
  /** Clears the cached reads of `resource` (and its dependents) after commit. */
  invalidate(workspaceId: string, resource: CacheResource): void;
}

/**
 * Runs a write in a transaction and the side effects it implies after the
 * commit. Events are rows inside the transaction, so they roll back with it,
 * and are sent through `ctx.defer` once it commits. A rollback sends nothing
 * and clears nothing.
 */
export async function transact<T>(
  ctx: ServiceContext,
  write: (work: UnitOfWork) => Promise<T>
): Promise<T> {
  const eventIds: string[] = [];
  const invalidations = new Map<string, [string, CacheResource]>();

  const result = await ctx.db.transaction((tx) =>
    write({
      tx,
      async emitEvent(options) {
        const event = await insertEvent(tx, options);
        eventIds.push(event.id);
      },
      invalidate(workspaceId, resource) {
        invalidations.set(`${workspaceId}:${resource}`, [
          workspaceId,
          resource,
        ]);
      },
    })
  );

  if (eventIds.length > 0) {
    ctx.defer(publishEvents(ctx, eventIds));
  }
  for (const [workspaceId, resource] of invalidations.values()) {
    ctx.defer(invalidateCache(ctx, workspaceId, resource));
  }

  return result;
}
