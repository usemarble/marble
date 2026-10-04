import type { ServiceContext } from "../context";
import { type CacheResource, createCacheClient } from "../lib/cache";

/**
 * Cached reads that embed another resource's data. A write to the key clears
 * these too: tag, category and author reads carry post counts, and post reads
 * carry their tags, categories and authors.
 */
const DEPENDENTS: Record<CacheResource, readonly CacheResource[]> = {
  posts: ["tags", "categories", "authors"],
  tags: ["posts"],
  categories: ["posts"],
  authors: ["posts"],
  fields: ["posts"],
  media: ["posts"],
};

/**
 * Clears a workspace's cached reads of `resource` and everything that embeds
 * it. `cache:{ws}:{resource}:*` matches every view (`/v1` and dashboard).
 * Runs after the write commits; Redis errors are logged and swallowed.
 */
export async function invalidateCache(
  ctx: Pick<ServiceContext, "env">,
  workspaceId: string,
  resource: CacheResource
) {
  const cache = createCacheClient(ctx.env.REDIS_URL, ctx.env.REDIS_TOKEN);
  await Promise.all(
    [resource, ...DEPENDENTS[resource]].map((entry) =>
      cache.invalidateResource(workspaceId, entry)
    )
  );
}
