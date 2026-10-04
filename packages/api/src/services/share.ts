import { createRecordId } from "@marble/db/id";
import { post, shareLink, subscription } from "@marble/db/schema";
import { canPerformAction, getWorkspacePlan } from "@marble/utils";
import { and, desc, eq, gt, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { ServiceContext } from "../context";
import { transact } from "../lib/transaction";

export class ShareError extends Error {
  readonly status: 403 | 404 | 410 | 500;
  constructor(status: 403 | 404 | 410 | 500, message: string) {
    super(message);
    this.status = status;
  }
}

export async function createShareLink(
  ctx: ServiceContext,
  workspaceId: string,
  postId: string
) {
  const { db } = ctx;
  const subscriptions = await db
    .select()
    .from(subscription)
    .where(
      and(
        eq(subscription.workspaceId, workspaceId),
        or(
          eq(subscription.status, "active"),
          eq(subscription.status, "trialing"),
          and(
            eq(subscription.status, "canceled"),
            eq(subscription.cancelAtPeriodEnd, true),
            gt(subscription.currentPeriodEnd, new Date())
          )
        )
      )
    )
    .orderBy(desc(subscription.createdAt))
    .limit(1);

  const activeSubscription = subscriptions[0] ?? null;
  const plan = getWorkspacePlan(activeSubscription);
  if (!canPerformAction(plan, "shareDrafts")) {
    throw new ShareError(403, "Upgrade to Hobby to share drafts");
  }

  const postRow = await db.query.post.findFirst({
    where: and(eq(post.id, postId), eq(post.workspaceId, workspaceId)),
    columns: {
      id: true,
      title: true,
      status: true,
    },
  });

  if (!postRow) {
    throw new ShareError(404, "Post not found");
  }

  const existingShareLink = await db.query.shareLink.findFirst({
    where: and(
      eq(shareLink.postId, postId),
      eq(shareLink.isActive, true),
      gt(shareLink.expiresAt, new Date())
    ),
  });

  if (existingShareLink) {
    return {
      shareLink: `${ctx.env.APP_URL}/share/${existingShareLink.token}`,
      expiresAt: existingShareLink.expiresAt,
    };
  }

  return transact(ctx, async ({ tx }) => {
    const token = nanoid(32);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    const now = new Date();
    const [created] = await tx
      .insert(shareLink)
      .values({
        id: createRecordId(),
        token,
        postId,
        workspaceId,
        expiresAt,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    if (!created) {
      throw new ShareError(500, "Failed to create share link");
    }
    return {
      shareLink: `${ctx.env.APP_URL}/share/${created.token}`,
      expiresAt: created.expiresAt,
    };
  });
}

export async function getShareLink(ctx: ServiceContext, token: string) {
  const { db } = ctx;
  const shareLinkRow = await db.query.shareLink.findFirst({
    where: and(eq(shareLink.token, token), eq(shareLink.isActive, true)),
    with: {
      post: {
        columns: {
          id: true,
          title: true,
          content: true,
          contentJson: true,
          description: true,
          coverImage: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          publishedAt: true,
        },
        with: {
          authors: {
            with: {
              author: {
                columns: {
                  id: true,
                  name: true,
                  image: true,
                  bio: true,
                },
              },
            },
          },
          category: {
            columns: {
              id: true,
              name: true,
              slug: true,
            },
          },
          tags: {
            with: {
              tag: {
                columns: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
          workspace: {
            columns: {
              id: true,
              name: true,
              logo: true,
              slug: true,
            },
          },
        },
      },
    },
  });

  if (!shareLinkRow) {
    throw new ShareError(404, "Share link not found");
  }

  if (shareLinkRow.expiresAt < new Date()) {
    throw new ShareError(410, "Share link has expired");
  }

  const { post: postRow } = shareLinkRow;

  return {
    post: {
      id: postRow.id,
      title: postRow.title,
      content: postRow.content,
      contentJson: postRow.contentJson,
      description: postRow.description,
      coverImage: postRow.coverImage,
      status: postRow.status,
      createdAt: postRow.createdAt,
      updatedAt: postRow.updatedAt,
      publishedAt: postRow.publishedAt,
      authors: postRow.authors.map((entry) => entry.author),
      category: postRow.category,
      tags: postRow.tags.map((entry) => entry.tag),
      workspace: postRow.workspace,
    },
    expiresAt: shareLinkRow.expiresAt,
  };
}
