import type { DbClient } from "@/lib/db";
import { generateSlug } from "@/utils/import-content";

const UNCATEGORIZED_CATEGORY = {
  name: "Uncategorized",
  slug: "uncategorized",
};

export const MAX_UNIQUE_SLUG_ATTEMPTS = 25;

/** Detects Prisma unique constraint errors without importing runtime types. */
export function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

/** Returns a bounded slug candidate for retrying raced unique writes. */
export function getSlugAttempt(
  preferredSlug: string,
  attempt: number,
  fallbackSlug: string
) {
  const baseSlug = preferredSlug || fallbackSlug;
  return attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
}

/** Marks an import job as failed with a user-visible error message. */
export async function failImportJob({
  db,
  jobId,
  message,
}: {
  db: DbClient;
  jobId: string;
  message: string;
}) {
  await db.importJob.update({
    where: { id: jobId },
    data: {
      status: "failed",
      failedAt: new Date(),
      errorMessage: message,
    },
  });
}

/** Finds a unique post slug within the workspace by appending a numeric suffix. */
export async function getUniquePostSlug(
  db: DbClient,
  workspaceId: string,
  preferredSlug: string
) {
  const baseSlug = preferredSlug || "post";
  let slug = baseSlug;
  let suffix = 1;

  while (
    await db.post.findUnique({
      where: { workspaceId_slug: { workspaceId, slug } },
      select: { id: true },
    })
  ) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  return slug;
}

/** Finds a unique author slug within the workspace by appending a numeric suffix. */
export async function getUniqueAuthorSlug(
  db: DbClient,
  workspaceId: string,
  preferredSlug: string
) {
  const baseSlug = preferredSlug || "imported-author";
  let slug = baseSlug;
  let suffix = 1;

  while (
    await db.author.findUnique({
      where: { workspaceId_slug: { workspaceId, slug } },
      select: { id: true },
    })
  ) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  return slug;
}

/** Resolves the import author from the creating user, or creates a fallback author. */
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
        return await db.author.upsert({
          where: {
            workspaceId_userId: {
              workspaceId: job.workspaceId,
              userId: job.createdBy.id,
            },
          },
          update: {},
          create: {
            name: job.createdBy.name,
            email: job.createdBy.email,
            slug,
            image: job.createdBy.image,
            workspaceId: job.workspaceId,
            userId: job.createdBy.id,
            role: "Writer",
          },
          select: { id: true },
        });
      } catch (error) {
        if (!isUniqueConstraintError(error)) {
          throw error;
        }
      }
    }

    throw new Error("Could not create an import author with a unique slug");
  }

  return await db.author.upsert({
    where: {
      workspaceId_slug: {
        workspaceId: job.workspaceId,
        slug: "imported-author",
      },
    },
    update: {},
    create: {
      name: "Imported Author",
      slug: "imported-author",
      workspaceId: job.workspaceId,
      role: "Writer",
    },
    select: { id: true },
  });
}

/** Ensures every import has a category by creating or reusing Uncategorized. */
export async function getUncategorizedCategory(
  db: DbClient,
  workspaceId: string
) {
  return await db.category.upsert({
    where: {
      workspaceId_slug: {
        workspaceId,
        slug: UNCATEGORIZED_CATEGORY.slug,
      },
    },
    update: {},
    create: {
      ...UNCATEGORIZED_CATEGORY,
      workspaceId,
    },
    select: { id: true },
  });
}

/** Loads an import job with the creator data needed for author resolution. */
export async function getImportJob(db: DbClient, jobId: string) {
  return await db.importJob.findUnique({
    where: { id: jobId },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });
}
