import type { DbClient } from "@/lib/db";
import { generateSlug } from "@/utils/import-content";

const UNCATEGORIZED_CATEGORY = {
  name: "Uncategorized",
  slug: "uncategorized",
};

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
    const slug = await getUniqueAuthorSlug(
      db,
      job.workspaceId,
      userSlugBase || "imported-author"
    );

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
