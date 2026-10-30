import type { DbClient } from "@marble/db";
import { post } from "@marble/db/schema";
import { type EventMessage, toPostPayload } from "@marble/events";
import { and, asc, count, eq, lt, lte, notInArray } from "drizzle-orm";
import { log } from "evlog";
import type { QueuePublisher } from "../context";
import { type CacheContext, invalidateCacheOrThrow } from "./cache";
import { insertEvent, publishEvents } from "./events";

const OVERDUE_ALERT_MS = 5 * 60_000;

export interface ScheduledPostsContext extends CacheContext {
  db: DbClient;
  queues: { events: QueuePublisher<EventMessage> };
}

export interface PublishDuePostsOptions {
  now?: Date;
  /** The most posts one run publishes. The next run takes the rest. */
  limit?: number;
}

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

/** The Redis client already retries with backoff before this throws. */
async function clearWorkspaceCache(
  ctx: ScheduledPostsContext,
  workspaceId: string
) {
  try {
    await invalidateCacheOrThrow(ctx, workspaceId, "posts");
  } catch (error) {
    log.error({
      action: "scheduled_posts.clear_cache",
      workspaceId,
      error: errorMessage(error),
    });
  }
}

/**
 * Publishes the scheduled posts whose go-live time has passed. Each post flips
 * in its own transaction with its outbox row, so one bad row can't block other
 * workspaces and a post never goes live without its event. The status guard and
 * `SKIP LOCKED` make overlapping and retried runs safe.
 *
 * The cache clears before the webhook goes out: a site that rebuilds on
 * `post.published` must not read a list that is missing the post.
 */
export async function publishDuePosts(
  ctx: ScheduledPostsContext,
  { now = new Date(), limit = 100 }: PublishDuePostsOptions = {}
) {
  const failedIds: string[] = [];
  const eventIds: string[] = [];
  const workspaceIds = new Set<string>();

  while (eventIds.length < limit) {
    let candidateId: string | undefined;
    try {
      const published = await ctx.db.transaction(async (tx) => {
        const [due] = await tx
          .select({ id: post.id })
          .from(post)
          .where(
            and(
              eq(post.status, "scheduled"),
              lte(post.publishedAt, now),
              failedIds.length > 0 ? notInArray(post.id, failedIds) : undefined
            )
          )
          .orderBy(asc(post.publishedAt))
          .limit(1)
          .for("update", { skipLocked: true });

        if (!due) {
          return null;
        }
        candidateId = due.id;

        const [row] = await tx
          .update(post)
          .set({ status: "published", updatedAt: now })
          .where(and(eq(post.id, due.id), eq(post.status, "scheduled")))
          .returning({
            id: post.id,
            workspaceId: post.workspaceId,
            title: post.title,
            slug: post.slug,
            description: post.description,
            coverImage: post.coverImage,
            status: post.status,
            featured: post.featured,
            categoryId: post.categoryId,
            primaryAuthorId: post.primaryAuthorId,
            publishedAt: post.publishedAt,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
          });

        if (!row) {
          throw new Error("Scheduled post disappeared while locked");
        }

        const event = await insertEvent(tx, {
          type: "post_published",
          workspaceId: row.workspaceId,
          source: "system",
          resourceType: "post",
          resourceId: row.id,
          actorType: "system",
          payload: toPostPayload(row),
        });

        return { eventId: event.id, workspaceId: row.workspaceId };
      });

      if (!published) {
        break;
      }
      eventIds.push(published.eventId);
      workspaceIds.add(published.workspaceId);
    } catch (error) {
      log.error({
        action: "scheduled_posts.publish",
        postId: candidateId,
        error: errorMessage(error),
      });
      // No candidate means the query itself failed, so another try won't help.
      if (!candidateId) {
        break;
      }
      failedIds.push(candidateId);
    }
  }

  for (const workspaceId of workspaceIds) {
    await clearWorkspaceCache(ctx, workspaceId);
  }
  await publishEvents(ctx, eventIds);

  const [overdue] = await ctx.db
    .select({ total: count() })
    .from(post)
    .where(
      and(
        eq(post.status, "scheduled"),
        lt(post.publishedAt, new Date(now.getTime() - OVERDUE_ALERT_MS))
      )
    );
  if (overdue && overdue.total > 0) {
    log.error({ action: "scheduled_posts.overdue", total: overdue.total });
  }

  return { published: eventIds.length, failed: failedIds.length };
}
