import { db } from "@marble/db";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { shareLinkSchema } from "@/lib/validations/post";

export async function POST(request: Request) {
  const sessionData = await getServerSession();
  const activeWorkspaceId = sessionData?.session.activeOrganizationId;

  if (!sessionData || !activeWorkspaceId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const values = shareLinkSchema.safeParse(await request.json());
  if (!values.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: values.error.issues },
      { status: 400 }
    );
  }

  const { postId } = values.data;

  // Verify the post exists and belongs to the user's workspace
  const post = await db.post.findFirst({
    where: {
      id: postId,
      workspaceId: activeWorkspaceId,
    },
    select: {
      id: true,
      title: true,
      status: true,
    },
  });

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const existingShareLink = await db.shareLink.findFirst({
    where: {
      postId,
      isActive: true,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  if (existingShareLink) {
    return NextResponse.json({
      shareLink: `${process.env.NEXT_PUBLIC_APP_URL}/share/${existingShareLink.token}`,
      expiresAt: existingShareLink.expiresAt,
    });
  }

  const token = nanoid(32);

  // 24 hours from now
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  const shareLink = await db.shareLink.create({
    data: {
      token,
      postId,
      workspaceId: activeWorkspaceId,
      expiresAt,
    },
  });

  return NextResponse.json({
    shareLink: `${process.env.NEXT_PUBLIC_APP_URL}/share/${shareLink.token}`,
    expiresAt: shareLink.expiresAt,
  });
}
