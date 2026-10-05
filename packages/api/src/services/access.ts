import { findMembership, findWorkspacePlan } from "@marble/auth/access";
import { Redis } from "@upstash/redis";
import type { ServiceContext } from "../context";

function redisFor({ env }: Pick<ServiceContext, "env">) {
  return new Redis({ url: env.REDIS_URL, token: env.REDIS_TOKEN });
}

/** The user's role in the workspace, or `null` if they are not a member. */
export function getMembership(
  ctx: Pick<ServiceContext, "db" | "env">,
  workspaceId: string,
  userId: string
) {
  return findMembership(
    { db: ctx.db, redis: redisFor(ctx) },
    workspaceId,
    userId
  );
}

/** The plan the workspace is entitled to right now. */
export function getWorkspacePlan(
  ctx: Pick<ServiceContext, "db" | "env">,
  workspaceId: string
) {
  return findWorkspacePlan({ db: ctx.db, redis: redisFor(ctx) }, workspaceId);
}
