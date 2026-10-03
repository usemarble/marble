import type { DbClient } from "@marble/db";
import { createRecordId } from "@marble/db/id";
import { workspaceEvent } from "@marble/db/schema";
import type {
  EventMessage,
  EventPayload,
  WorkspaceEventActorType,
  WorkspaceEventResourceType,
  WorkspaceEventSource,
  WorkspaceEventType,
} from "@marble/events";
import { and, asc, eq, isNull, lt } from "drizzle-orm";
import { log } from "evlog";
import type { DbTransaction, QueuePublisher } from "../context";

/**
 * Workspace events use a transactional outbox. The row is written in the same
 * transaction as the change it describes (`insertEvent`), so it exists if and
 * only if the change committed. The queue message is sent after the commit
 * (`publishEvents`) and the row is stamped `enqueuedAt` once it is on the
 * queue. A row that never gets stamped, because the send or the stamp failed or
 * the Worker was recycled first, is picked up by `sweepEvents` in apps/jobs.
 * Delivery is at-least-once: the fan-out consumer skips events it already
 * processed.
 */

export interface EventOptions {
  type: WorkspaceEventType;
  workspaceId: string;
  resourceType: WorkspaceEventResourceType;
  resourceId: string;
  source?: WorkspaceEventSource;
  actorType?: WorkspaceEventActorType;
  actorId?: string;
  payload?: EventPayload;
}

/** Writes the outbox row. Call it inside the transaction making the change. */
export async function insertEvent(tx: DbTransaction, options: EventOptions) {
  const [event] = await tx
    .insert(workspaceEvent)
    .values({
      id: createRecordId(),
      type: options.type,
      workspaceId: options.workspaceId,
      source: options.source ?? "api",
      resourceType: options.resourceType,
      resourceId: options.resourceId,
      actorType: options.actorType,
      actorId: options.actorId,
      payload: options.payload ?? {},
    })
    .returning({ id: workspaceEvent.id });

  if (!event) {
    throw new Error("Failed to create workspace event");
  }

  return event;
}

async function enqueue(
  db: DbClient,
  queue: QueuePublisher<EventMessage>,
  eventId: string
) {
  await queue.send({ type: "event.fanout", eventId });
  await db
    .update(workspaceEvent)
    .set({ enqueuedAt: new Date() })
    .where(eq(workspaceEvent.id, eventId));
}

/**
 * Sends the fan-out message for events whose transaction has committed. A
 * failure is logged and left for the sweep, never thrown: the change is saved
 * and the caller has nothing to retry.
 */
export async function publishEvents(
  ctx: { db: DbClient; queues: { events: QueuePublisher<EventMessage> } },
  eventIds: readonly string[]
) {
  for (const eventId of eventIds) {
    try {
      await enqueue(ctx.db, ctx.queues.events, eventId);
    } catch (error) {
      log.error({
        action: "outbox.publish",
        eventId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

export interface SweepOptions {
  now?: Date;
  /** How long a row may stay unsent before the sweep treats it as lost. */
  graceMs?: number;
  limit?: number;
}

/**
 * Re-sends events that were committed but never reached the queue. The grace
 * period keeps the sweep from racing a publish that is still in flight.
 * Returns how many events it enqueued.
 */
export async function sweepEvents(
  ctx: { db: DbClient; queue: QueuePublisher<EventMessage> },
  { now = new Date(), graceMs = 60_000, limit = 100 }: SweepOptions = {}
) {
  const stragglers = await ctx.db
    .select({ id: workspaceEvent.id })
    .from(workspaceEvent)
    .where(
      and(
        isNull(workspaceEvent.enqueuedAt),
        isNull(workspaceEvent.processedAt),
        lt(workspaceEvent.createdAt, new Date(now.getTime() - graceMs))
      )
    )
    .orderBy(asc(workspaceEvent.createdAt))
    .limit(limit);

  let enqueued = 0;
  for (const { id } of stragglers) {
    try {
      await enqueue(ctx.db, ctx.queue, id);
      enqueued += 1;
    } catch (error) {
      log.error({
        action: "outbox.sweep",
        eventId: id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return enqueued;
}
