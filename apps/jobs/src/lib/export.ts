import {
  author,
  category,
  exportJob,
  field,
  fieldOption,
  media as mediaTable,
  member,
  organization,
  post,
  tag,
} from "@marble/drizzle/schema";
import { sendExportReadyEmail } from "@marble/email";
import { and, asc, eq, sql } from "drizzle-orm";
import { Resend } from "resend";
import { EXPORT_TTL_MS, getAppUrl } from "@/lib/constants";
import type { DbClient } from "@/lib/db";
import { buildZipArchive, stringifyJsonFile } from "@/lib/files";
import type { Env } from "@/types/env";

function generateToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value)
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function getExportReadyEmailRecipients(job: {
  createdBy: { email: string; name: string } | null;
  workspace: {
    members: Array<{
      user: {
        email: string;
        name: string;
      };
    }>;
  };
}) {
  const recipients = new Map<string, { email: string; name: string }>();

  for (const workspaceMember of job.workspace.members) {
    recipients.set(workspaceMember.user.email, workspaceMember.user);
  }

  if (job.createdBy?.email) {
    recipients.set(job.createdBy.email, job.createdBy);
  }

  return Array.from(recipients.values());
}

async function buildExportFiles(db: DbClient, workspaceId: string) {
  const [
    foundWorkspace,
    rawPosts,
    categories,
    tags,
    authors,
    mediaItems,
    fields,
  ] = await Promise.all([
    db.query.organization.findFirst({
      where: eq(organization.id, workspaceId),
      columns: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    db.query.post.findMany({
      where: eq(post.workspaceId, workspaceId),
      orderBy: asc(post.createdAt),
      columns: {
        id: true,
        title: true,
        slug: true,
        description: true,
        status: true,
        featured: true,
        coverImage: true,
        content: true,
        contentJson: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
      },
      with: {
        category: {
          columns: {
            id: true,
            name: true,
            slug: true,
            description: true,
          },
        },
        tags: {
          with: {
            tag: {
              columns: {
                id: true,
                name: true,
                slug: true,
                description: true,
              },
            },
          },
        },
        authors: {
          with: {
            author: {
              columns: {
                id: true,
                name: true,
                slug: true,
                bio: true,
                image: true,
                role: true,
              },
              with: {
                socials: {
                  columns: {
                    platform: true,
                    url: true,
                  },
                },
              },
            },
          },
        },
        fieldValues: {
          columns: {
            value: true,
          },
          with: {
            field: {
              columns: {
                id: true,
                key: true,
                name: true,
                type: true,
              },
            },
          },
        },
      },
    }),
    db.query.category.findMany({
      where: eq(category.workspaceId, workspaceId),
      orderBy: asc(category.createdAt),
      columns: {
        id: true,
        name: true,
        slug: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    db.query.tag.findMany({
      where: eq(tag.workspaceId, workspaceId),
      orderBy: asc(tag.createdAt),
      columns: {
        id: true,
        name: true,
        slug: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    db.query.author.findMany({
      where: eq(author.workspaceId, workspaceId),
      orderBy: asc(author.createdAt),
      columns: {
        id: true,
        name: true,
        slug: true,
        bio: true,
        image: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      with: {
        socials: {
          columns: {
            platform: true,
            url: true,
          },
        },
      },
    }),
    db.query.media.findMany({
      where: eq(mediaTable.workspaceId, workspaceId),
      orderBy: asc(mediaTable.createdAt),
      columns: {
        id: true,
        name: true,
        url: true,
        alt: true,
        size: true,
        mimeType: true,
        width: true,
        height: true,
        duration: true,
        blurHash: true,
        type: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    db.query.field.findMany({
      where: eq(field.workspaceId, workspaceId),
      orderBy: [asc(field.position), asc(field.createdAt)],
      columns: {
        id: true,
        key: true,
        name: true,
        description: true,
        type: true,
        required: true,
        position: true,
        createdAt: true,
        updatedAt: true,
      },
      with: {
        options: {
          orderBy: [asc(fieldOption.position), asc(fieldOption.createdAt)],
          columns: {
            id: true,
            value: true,
            label: true,
            position: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    }),
  ]);

  if (!foundWorkspace) {
    throw new Error("Workspace not found");
  }

  const posts = rawPosts.map((entry) => ({
    id: entry.id,
    title: entry.title,
    slug: entry.slug,
    description: entry.description,
    status: entry.status,
    featured: entry.featured,
    coverImage: entry.coverImage,
    content: entry.content,
    contentJson: entry.contentJson,
    publishedAt: entry.publishedAt,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    category: entry.category,
    tags: entry.tags.map((junction) => junction.tag),
    authors: entry.authors.map((junction) => junction.author),
    fieldValues: entry.fieldValues.map((fieldValue) => ({
      value: fieldValue.value,
      field: fieldValue.field,
    })),
  }));

  const exportedAt = new Date().toISOString();
  const manifest = {
    provider: "marble",
    schemaVersion: 1,
    format: "json",
    exportedAt,
    workspace: foundWorkspace,
    resources: {
      posts: posts.length,
      categories: categories.length,
      tags: tags.length,
      authors: authors.length,
      media: mediaItems.length,
      fields: fields.length,
    },
    includesMediaFiles: false,
  };

  return {
    workspace: foundWorkspace,
    files: {
      "manifest.json": stringifyJsonFile(manifest),
      "posts.json": stringifyJsonFile(posts),
      "categories.json": stringifyJsonFile(categories),
      "tags.json": stringifyJsonFile(tags),
      "authors.json": stringifyJsonFile(authors),
      "media.json": stringifyJsonFile(mediaItems),
      "fields.json": stringifyJsonFile(fields),
    },
  };
}

export async function runExport(db: DbClient, env: Env, jobId: string) {
  const job = await db.query.exportJob.findFirst({
    where: eq(exportJob.id, jobId),
    with: {
      createdBy: {
        columns: {
          email: true,
          name: true,
        },
      },
      workspace: {
        columns: {
          name: true,
          slug: true,
        },
        with: {
          members: {
            where: eq(member.role, "owner"),
            with: {
              user: {
                columns: {
                  email: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!job) {
    console.error(`[Export] Job not found: ${jobId}`);
    return;
  }

  if (job.status === "ready" || job.status === "expired") {
    return;
  }

  const claimed = await db
    .update(exportJob)
    .set({
      status: "processing",
      startedAt: job.startedAt ?? new Date(),
      attemptCount: sql`${exportJob.attemptCount} + 1`,
      updatedAt: new Date(),
    })
    .where(and(eq(exportJob.id, job.id), eq(exportJob.status, "queued")))
    .returning({ id: exportJob.id });

  if (claimed.length === 0) {
    return;
  }

  try {
    const { workspace: exportedWorkspace, files } = await buildExportFiles(
      db,
      job.workspaceId
    );
    const archive = buildZipArchive(files);
    const token = generateToken();
    const tokenHash = await sha256Hex(token);
    const expiresAt = new Date(Date.now() + EXPORT_TTL_MS);
    const storageKey = `exports/${job.workspaceId}/${job.id}.zip`;
    const completedAt = new Date();

    await env.STORAGE.put(storageKey, archive, {
      httpMetadata: {
        contentType: "application/zip",
      },
    });

    await db
      .update(exportJob)
      .set({
        status: "ready",
        storageKey,
        fileSize: archive.byteLength,
        downloadTokenHash: tokenHash,
        expiresAt,
        completedAt,
        errorMessage: null,
        updatedAt: new Date(),
      })
      .where(eq(exportJob.id, job.id));

    const emailRecipients = getExportReadyEmailRecipients(job);

    if (emailRecipients.length > 0 && env.RESEND_API_KEY) {
      try {
        const downloadUrl = `${getAppUrl(env)}/api/data/export/${job.id}/download?token=${token}`;
        const resend = new Resend(env.RESEND_API_KEY);
        let sentCount = 0;

        for (const recipient of emailRecipients) {
          const result = await sendExportReadyEmail(resend, {
            userEmail: recipient.email,
            userName: recipient.name,
            workspaceName: exportedWorkspace.name,
            downloadUrl,
            expiresAt,
          });

          if (result.error) {
            console.error("[Export] Failed to send ready email:", {
              error: result.error,
              jobId: job.id,
              recipient: recipient.email,
            });
            continue;
          }

          sentCount += 1;
          console.info(
            `[Export] Ready email sent for ${job.id}: ${result.data?.id ?? "unknown"}`
          );
        }

        if (sentCount > 0) {
          await db
            .update(exportJob)
            .set({ emailSentAt: new Date(), updatedAt: new Date() })
            .where(eq(exportJob.id, job.id));
        }
      } catch (error) {
        console.error("[Export] Failed to send ready email:", error);
      }
    } else {
      console.info("[Export] Skipping ready email:", {
        hasRecipient: emailRecipients.length > 0,
        hasResendApiKey: Boolean(env.RESEND_API_KEY),
        jobId: job.id,
      });
    }
  } catch (error) {
    await db
      .update(exportJob)
      .set({
        status: "queued",
        errorMessage:
          error instanceof Error ? error.message : "Failed to process export",
        updatedAt: new Date(),
      })
      .where(eq(exportJob.id, job.id));

    throw error;
  }
}
