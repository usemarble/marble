import { sendExportReadyEmail } from "@marble/email";
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

  for (const member of job.workspace.members) {
    recipients.set(member.user.email, member.user);
  }

  if (job.createdBy?.email) {
    recipients.set(job.createdBy.email, job.createdBy);
  }

  return Array.from(recipients.values());
}

async function buildExportFiles(db: DbClient, workspaceId: string) {
  const [workspace, posts, categories, tags, authors, media, fields] =
    await Promise.all([
      db.organization.findUnique({
        where: { id: workspaceId },
        select: {
          id: true,
          name: true,
          slug: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      db.post.findMany({
        where: { workspaceId },
        orderBy: { createdAt: "asc" },
        select: {
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
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
            },
          },
          tags: {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
            },
          },
          authors: {
            select: {
              id: true,
              name: true,
              slug: true,
              bio: true,
              image: true,
              role: true,
              socials: {
                select: {
                  platform: true,
                  url: true,
                },
              },
            },
          },
          fieldValues: {
            select: {
              value: true,
              field: {
                select: {
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
      db.category.findMany({
        where: { workspaceId },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      db.tag.findMany({
        where: { workspaceId },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      db.author.findMany({
        where: { workspaceId },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          bio: true,
          image: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          socials: {
            select: {
              platform: true,
              url: true,
            },
          },
        },
      }),
      db.media.findMany({
        where: { workspaceId },
        orderBy: { createdAt: "asc" },
        select: {
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
      db.field.findMany({
        where: { workspaceId },
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          key: true,
          name: true,
          description: true,
          type: true,
          required: true,
          position: true,
          createdAt: true,
          updatedAt: true,
          options: {
            orderBy: [{ position: "asc" }, { createdAt: "asc" }],
            select: {
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

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  const exportedAt = new Date().toISOString();
  const manifest = {
    provider: "marble",
    schemaVersion: 1,
    format: "json",
    exportedAt,
    workspace,
    resources: {
      posts: posts.length,
      categories: categories.length,
      tags: tags.length,
      authors: authors.length,
      media: media.length,
      fields: fields.length,
    },
    includesMediaFiles: false,
  };

  return {
    workspace,
    files: {
      "manifest.json": stringifyJsonFile(manifest),
      "posts.json": stringifyJsonFile(posts),
      "categories.json": stringifyJsonFile(categories),
      "tags.json": stringifyJsonFile(tags),
      "authors.json": stringifyJsonFile(authors),
      "media.json": stringifyJsonFile(media),
      "fields.json": stringifyJsonFile(fields),
    },
  };
}

export async function runExport(db: DbClient, env: Env, jobId: string) {
  const job = await db.exportJob.findUnique({
    where: { id: jobId },
    include: {
      createdBy: {
        select: {
          email: true,
          name: true,
        },
      },
      workspace: {
        select: {
          name: true,
          slug: true,
          members: {
            where: { role: "owner" },
            select: {
              user: {
                select: {
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

  const claim = await db.exportJob.updateMany({
    where: {
      id: job.id,
      status: "queued",
    },
    data: {
      status: "processing",
      startedAt: job.startedAt ?? new Date(),
      attemptCount: { increment: 1 },
    },
  });

  if (claim.count === 0) {
    return;
  }

  try {
    const { workspace, files } = await buildExportFiles(db, job.workspaceId);
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

    await db.exportJob.update({
      where: { id: job.id },
      data: {
        status: "ready",
        storageKey,
        fileSize: archive.byteLength,
        downloadTokenHash: tokenHash,
        expiresAt,
        completedAt,
        errorMessage: null,
      },
    });

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
            workspaceName: workspace.name,
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
          await db.exportJob.update({
            where: { id: job.id },
            data: { emailSentAt: new Date() },
          });
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
    await db.exportJob.update({
      where: { id: job.id },
      data: {
        status: "queued",
        errorMessage:
          error instanceof Error ? error.message : "Failed to process export",
      },
    });

    throw error;
  }
}
