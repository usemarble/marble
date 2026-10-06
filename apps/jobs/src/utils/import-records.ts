import { createRecordId } from "@marble/db/id";
import { isPgUniqueViolation } from "@marble/db/pg-errors";
import { author, category, importJob, post, tag } from "@marble/db/schema";
import { and, eq } from "drizzle-orm";
import type { DbClient } from "@/lib/db";
import { generateSlug } from "@/utils/import-content";

const UNCATEGORIZED_CATEGORY = {
  name: "Uncategorized",
  slug: "uncategorized",
};

const POST_WORKSPACE_SLUG_UNIQUE = "post_workspaceId_slug_key";
const AUTHOR_WORKSPACE_SLUG_UNIQUE = "author_workspaceId_slug_key";
const AUTHOR_WORKSPACE_USER_UNIQUE = "author_workspaceId_userId_key";
const CATEGORY_WORKSPACE_SLUG_UNIQUE = "category_workspaceId_slug_key";

export const MAX_UNIQUE_SLUG_ATTEMPTS = 25;

export function isUniqueConstraintError(error: unknown) {
  return (
    isPgUniqueViolation(error, POST_WORKSPACE_SLUG_UNIQUE) ||
    isPgUniqueViolation(error, AUTHOR_WORKSPACE_SLUG_UNIQUE) ||
    isPgUniqueViolation(error, AUTHOR_WORKSPACE_USER_UNIQUE) ||
    isPgUniqueViolation(error, CATEGORY_WORKSPACE_SLUG_UNIQUE)
  );
}

export function getSlugAttempt(
  preferredSlug: string,
  attempt: number,
  fallbackSlug: string
) {
  const baseSlug = preferredSlug || fallbackSlug;
  return attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
}

export async function failImportJob({
  db,
  jobId,
  message,
}: {
  db: DbClient;
  jobId: string;
  message: string;
}) {
  await db
    .update(importJob)
    .set({
      status: "failed",
      failedAt: new Date(),
      errorMessage: message,
      updatedAt: new Date(),
    })
    .where(eq(importJob.id, jobId));
}

export async function getUniquePostSlug(
  db: DbClient,
  workspaceId: string,
  preferredSlug: string
) {
  const baseSlug = preferredSlug || "post";
  let slug = baseSlug;
  let suffix = 1;

  while (
    await db.query.post.findFirst({
      where: and(eq(post.workspaceId, workspaceId), eq(post.slug, slug)),
      columns: { id: true },
    })
  ) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  return slug;
}

export async function getUniqueAuthorSlug(
  db: DbClient,
  workspaceId: string,
  preferredSlug: string
) {
  const baseSlug = preferredSlug || "imported-author";
  let slug = baseSlug;
  let suffix = 1;

  while (
    await db.query.author.findFirst({
      where: and(eq(author.workspaceId, workspaceId), eq(author.slug, slug)),
      columns: { id: true },
    })
  ) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  return slug;
}

export async function getImportAuthor(
  db: DbClient,
  job: NonNullable<Awaited<ReturnType<typeof getImportJob>>>
) {
  if (job.createdBy) {
    const userSlugBase =
      generateSlug(job.createdBy.name) || generateSlug(job.createdBy.email);

    for (let attempt = 0; attempt < MAX_UNIQUE_SLUG_ATTEMPTS; attempt += 1) {
      const slug = await getUniqueAuthorSlug(
        db,
        job.workspaceId,
        getSlugAttempt(userSlugBase || "", attempt, "imported-author")
      );

      try {
        const [result] = await db
          .insert(author)
          .values({
            id: createRecordId(),
            name: job.createdBy.name,
            email: job.createdBy.email,
            slug,
            image: job.createdBy.image,
            workspaceId: job.workspaceId,
            userId: job.createdBy.id,
            role: "Writer",
          })
          .onConflictDoUpdate({
            target: [author.workspaceId, author.userId],
            set: { updatedAt: new Date() },
          })
          .returning({ id: author.id });

        if (result) {
          return result;
        }
      } catch (error) {
        if (!isUniqueConstraintError(error)) {
          throw error;
        }
      }
    }

    throw new Error("Could not create an import author with a unique slug");
  }

  const [result] = await db
    .insert(author)
    .values({
      id: createRecordId(),
      name: "Imported Author",
      slug: "imported-author",
      workspaceId: job.workspaceId,
      role: "Writer",
    })
    .onConflictDoUpdate({
      target: [author.workspaceId, author.slug],
      set: { updatedAt: new Date() },
    })
    .returning({ id: author.id });

  if (!result) {
    throw new Error("Could not resolve import author");
  }

  return result;
}

/** Finds a workspace category or tag by slug, creating it when missing. */
async function findOrCreateTaxonomy(
  db: DbClient,
  table: typeof category | typeof tag,
  workspaceId: string,
  name: string,
  slug: string
) {
  const findExisting = async () => {
    const [existing] = await db
      .select({ id: table.id })
      .from(table)
      .where(and(eq(table.workspaceId, workspaceId), eq(table.slug, slug)))
      .limit(1);
    return existing?.id;
  };

  const existingId = await findExisting();

  if (existingId) {
    return existingId;
  }

  const [created] = await db
    .insert(table)
    .values({ id: createRecordId(), name, slug, workspaceId })
    .onConflictDoNothing({ target: [table.workspaceId, table.slug] })
    .returning({ id: table.id });

  // A concurrent import can create the same slug between the lookup and insert.
  const id = created?.id ?? (await findExisting());

  if (!id) {
    throw new Error(`Could not resolve "${name}"`);
  }

  return id;
}

/**
 * Resolves frontmatter categories and tags to workspace records by slug,
 * creating missing ones. Lookups are memoized for the length of one import.
 */
export function createImportTaxonomy(db: DbClient, workspaceId: string) {
  const categoryIds = new Map<string, string>();
  const tagIds = new Map<string, string>();

  const resolve = async (
    cache: Map<string, string>,
    table: typeof category | typeof tag,
    name: string,
    slug: string
  ) => {
    const cached = cache.get(slug);

    if (cached) {
      return cached;
    }

    const id = await findOrCreateTaxonomy(db, table, workspaceId, name, slug);
    cache.set(slug, id);
    return id;
  };

  return {
    /** Returns the named category, or Uncategorized when there isn't one. */
    category(name?: string) {
      const slug = name ? generateSlug(name) : "";

      if (!(name && slug)) {
        return resolve(
          categoryIds,
          category,
          UNCATEGORIZED_CATEGORY.name,
          UNCATEGORIZED_CATEGORY.slug
        );
      }

      return resolve(categoryIds, category, name, slug);
    },

    /** Returns unique tag IDs, skipping names that don't produce a slug. */
    async tags(names: string[] = []) {
      const bySlug = new Map<string, string>();

      for (const name of names) {
        const slug = generateSlug(name);

        if (slug && !bySlug.has(slug)) {
          bySlug.set(slug, name);
        }
      }

      const ids: string[] = [];

      for (const [slug, name] of bySlug) {
        ids.push(await resolve(tagIds, tag, name, slug));
      }

      return ids;
    },
  };
}

export async function getImportJob(db: DbClient, jobId: string) {
  return await db.query.importJob.findFirst({
    where: eq(importJob.id, jobId),
    with: {
      createdBy: {
        columns: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });
}
