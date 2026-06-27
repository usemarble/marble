import { markdownToHtml, markdownToTiptap } from "@marble/parser/markdown";
import { sanitizeHtml } from "@marble/utils/sanitize";
import type { DbClient } from "@/lib/db";
import type { Env } from "@/types/env";
import type { ImportMarkdownFile } from "@/types/import";
import {
  getImportMarkdownFiles,
  parseMarkdownImport,
} from "@/utils/import-content";
import {
  failImportJob,
  getImportAuthor,
  getImportJob,
  getSlugAttempt,
  getUncategorizedCategory,
  getUniquePostSlug,
  isUniqueConstraintError,
  MAX_UNIQUE_SLUG_ATTEMPTS,
} from "@/utils/import-records";

type ImportJob = NonNullable<Awaited<ReturnType<typeof getImportJob>>>;

async function importMarkdownFile({
  authorId,
  categoryId,
  db,
  file,
  job,
  now,
}: {
  authorId: string;
  categoryId: string;
  db: DbClient;
  file: ImportMarkdownFile;
  job: ImportJob;
  now: Date;
}) {
  try {
    const parsed = parseMarkdownImport(file.sourceRef, file.content);
    const htmlContent = await markdownToHtml(parsed.content);
    const contentJson = markdownToTiptap(parsed.content);
    const cleanContent = sanitizeHtml(htmlContent);

    for (let attempt = 0; attempt < MAX_UNIQUE_SLUG_ATTEMPTS; attempt += 1) {
      const slug = await getUniquePostSlug(
        db,
        job.workspaceId,
        getSlugAttempt(parsed.slug, attempt, "post")
      );

      try {
        await db.$transaction(async (tx) => {
          const item = await tx.importItem.create({
            data: {
              importJobId: job.id,
              workspaceId: job.workspaceId,
              sourceRef: parsed.sourceRef,
              status: "pending",
              title: parsed.title,
              slug,
              content: cleanContent,
              contentJson,
              description: parsed.description,
              rawCategory: parsed.rawCategory,
              rawTags: parsed.rawTags,
              rawAuthor: parsed.rawAuthor,
              resolvedCategoryId: categoryId,
            },
            select: { id: true },
          });

          const post = await tx.post.create({
            data: {
              primaryAuthorId: authorId,
              title: parsed.title,
              slug,
              status: "draft",
              featured: false,
              content: cleanContent,
              contentJson,
              description: parsed.description,
              categoryId,
              publishedAt: now,
              workspaceId: job.workspaceId,
              authors: {
                connect: [{ id: authorId }],
              },
            },
            select: { id: true },
          });

          await tx.importItem.update({
            where: { id: item.id },
            data: {
              status: "imported",
              postId: post.id,
            },
          });
        });

        return "imported" as const;
      } catch (error) {
        if (!isUniqueConstraintError(error)) {
          throw error;
        }
      }
    }

    throw new Error("Could not create an imported post with a unique slug");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to import Markdown file";
    const fallbackTitle = file.sourceRef.split("/").pop() || file.sourceRef;

    await db.importItem.create({
      data: {
        importJobId: job.id,
        workspaceId: job.workspaceId,
        sourceRef: file.sourceRef,
        status: "failed",
        title: fallbackTitle,
        errors: { message },
      },
    });

    return "failed" as const;
  }
}

/**
 * Parses imported content and creates draft posts directly. The draft posts are
 * the review surface for v1.
 */
export async function runImport(db: DbClient, env: Env, jobId: string) {
  const job = await getImportJob(db, jobId);

  if (!job) {
    console.error(`[Import] Job not found: ${jobId}`);
    return;
  }

  if (job.status !== "queued") {
    return;
  }

  const claim = await db.importJob.updateMany({
    where: { id: job.id, status: "queued" },
    data: { status: "processing", startedAt: job.startedAt ?? new Date() },
  });

  if (claim.count === 0) {
    return;
  }

  if (job.source === "url") {
    await failImportJob({
      db,
      jobId: job.id,
      message: "URL imports are not implemented yet",
    });
    return;
  }

  if (!job.uploadKey) {
    await failImportJob({
      db,
      jobId: job.id,
      message: "Import upload is missing",
    });
    return;
  }

  const object = await env.STORAGE.get(job.uploadKey);

  if (!object) {
    await failImportJob({
      db,
      jobId: job.id,
      message: "Import upload was not found",
    });
    return;
  }

  let files: ImportMarkdownFile[];

  try {
    files = await getImportMarkdownFiles({ object, uploadKey: job.uploadKey });
  } catch (error) {
    await failImportJob({
      db,
      jobId: job.id,
      message:
        error instanceof Error ? error.message : "Failed to read import file",
    });
    return;
  }

  const category = await getUncategorizedCategory(db, job.workspaceId);
  const author = await getImportAuthor(db, job);
  const now = new Date();
  let importedItems = 0;
  let errorItems = 0;

  await db.importJob.update({
    where: { id: job.id },
    data: {
      totalItems: files.length,
      readyItems: 0,
      errorItems: 0,
      importedItems: 0,
    },
  });

  for (const file of files) {
    const result = await importMarkdownFile({
      authorId: author.id,
      categoryId: category.id,
      db,
      file,
      job,
      now,
    });

    if (result === "imported") {
      importedItems += 1;
    } else {
      errorItems += 1;
    }
  }

  await db.importJob.update({
    where: { id: job.id },
    data: {
      status: importedItems > 0 ? "completed" : "failed",
      completedAt: importedItems > 0 ? new Date() : null,
      failedAt: importedItems > 0 ? null : new Date(),
      errorMessage:
        errorItems > 0
          ? `${errorItems} of ${files.length} import item(s) failed`
          : null,
      totalItems: files.length,
      readyItems: 0,
      errorItems,
      importedItems,
    },
  });
}
