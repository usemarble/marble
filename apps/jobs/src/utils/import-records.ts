import { createRecordId } from "@marble/db/id";
import { isPgUniqueViolation } from "@marble/db/pg-errors";
import { author, category, importJob, post } from "@marble/db/schema";
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

export async function getUncategorizedCategory(
  db: DbClient,
  workspaceId: string
) {
  const [result] = await db
    .insert(category)
    .values({
      id: createRecordId(),
      ...UNCATEGORIZED_CATEGORY,
      workspaceId,
    })
    .onConflictDoUpdate({
      target: [category.workspaceId, category.slug],
      set: { updatedAt: new Date() },
    })
    .returning({ id: category.id });

  if (!result) {
    throw new Error("Could not resolve uncategorized category");
  }

  return result;
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
