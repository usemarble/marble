import { db, createRecordId } from "@marble/drizzle";
import { post, shareLink } from "@marble/drizzle/schema";

import { and, eq, gt } from "drizzle-orm";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { requireActiveWorkspaceAccess } from "@/lib/auth/access";
import { canPerformAction, getWorkspacePlan } from "@/lib/plans";
import { findActiveWorkspaceSubscription } from "@/lib/subscription/active-subscription";
import { shareLinkSchema } from "@/lib/validations/post";

export async function POST(request: Request) {
  const accessData = await requireActiveWorkspaceAccess();

  if (!accessData.ok) {
    return accessData.response;
  }

  const { workspaceId } = accessData;

  const activeSubscription = await findActiveWorkspaceSubscription(workspaceId);
  const plan = getWorkspacePlan(activeSubscription);
  if (!canPerformAction(plan, "shareDrafts")) {
    return NextResponse.json(
      { error: "Upgrade to Hobby to share drafts" },
      { status: 403 }
    );
  }

  const values = shareLinkSchema.safeParse(await request.json());
  if (!values.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: values.error.issues },
      { status: 400 }
    );
  }

  const { postId } = values.data;

  const postRow = await db.query.post.findFirst({
    where: and(eq(post.id, postId), eq(post.workspaceId, workspaceId)),
    columns: {
      id: true,
      title: true,
      status: true,
    },
  });

  if (!postRow) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const existingShareLink = await db.query.shareLink.findFirst({
    where: and(
      eq(shareLink.postId, postId),
      eq(shareLink.isActive, true),
      gt(shareLink.expiresAt, new Date())
    ),
  });

  if (existingShareLink) {
    return NextResponse.json({
      shareLink: `${process.env.NEXT_PUBLIC_APP_URL}/share/${existingShareLink.token}`,
      expiresAt: existingShareLink.expiresAt,
    });
  }

  const token = nanoid(32);

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  const now = new Date();
  const [createdShareLink] = await db
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

  if (!createdShareLink) {
    return NextResponse.json(
      { error: "Failed to create share link" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    shareLink: `${process.env.NEXT_PUBLIC_APP_URL}/share/${createdShareLink.token}`,
    expiresAt: createdShareLink.expiresAt,
  });
}
