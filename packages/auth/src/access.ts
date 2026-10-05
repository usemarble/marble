import type { DbClient } from "@marble/db";
import { member } from "@marble/db/schema";
import type { PlanType } from "@marble/utils";
import type { Redis } from "@upstash/redis";
import { and, eq } from "drizzle-orm";
import { getWorkspacePlanType } from "./subscription";

/**
 * Both lookups run on every dashboard call. A change clears its key (member
 * hooks and Polar webhooks below), so the TTL only bounds how long a missed
 * clear can serve a stale answer.
 */
const TTL_SECONDS = 60;

export const membershipKey = (workspaceId: string, userId: string) =>
  `member:${workspaceId}:${userId}`;

export const planKey = (workspaceId: string) => `plan:${workspaceId}`;

/**
 * Redis only speeds these lookups up. An outage must not turn into a denied
 * request or a failed write, so every Redis call falls back to the database.
 */
async function readCached<T>(redis: Redis, key: string): Promise<T | null> {
  try {
    return await redis.get<T>(key);
  } catch (error) {
    console.error(`[AccessCache] GET failed for ${key}:`, error);
    return null;
  }
}

async function writeCached(redis: Redis, key: string, value: unknown) {
  try {
    await redis.set(key, value, { ex: TTL_SECONDS });
  } catch (error) {
    console.error(`[AccessCache] SET failed for ${key}:`, error);
  }
}

async function clearCached(redis: Redis, key: string) {
  try {
    await redis.del(key);
  } catch (error) {
    console.error(`[AccessCache] DEL failed for ${key}:`, error);
  }
}

/**
 * The user's role in a workspace, or `null` when they are not a member. Only
 * memberships are cached: a miss always asks the database, so adding a member
 * needs no invalidation.
 */
export async function findMembership(
  { db, redis }: { db: DbClient; redis: Redis },
  workspaceId: string,
  userId: string
): Promise<{ role: string } | null> {
  const key = membershipKey(workspaceId, userId);
  const cached = await readCached<{ role: string }>(redis, key);
  if (cached) {
    return cached;
  }

  const found = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, workspaceId),
      eq(member.userId, userId)
    ),
    columns: { role: true },
  });
  if (!found) {
    return null;
  }

  // The column is nullable from before Better Auth; treat a missing role as
  // the least privileged one.
  const membership = { role: found.role ?? "member" };
  await writeCached(redis, key, membership);
  return membership;
}

export function clearMembership(
  redis: Redis,
  workspaceId: string,
  userId: string
) {
  return clearCached(redis, membershipKey(workspaceId, userId));
}

/** The plan a workspace is entitled to right now. */
export async function findWorkspacePlan(
  { db, redis }: { db: DbClient; redis: Redis },
  workspaceId: string
): Promise<PlanType> {
  const key = planKey(workspaceId);
  const cached = await readCached<PlanType>(redis, key);
  if (cached) {
    return cached;
  }

  const plan = await getWorkspacePlanType(db, workspaceId);
  await writeCached(redis, key, plan);
  return plan;
}

export function clearWorkspacePlan(redis: Redis, workspaceId: string) {
  return clearCached(redis, planKey(workspaceId));
}
