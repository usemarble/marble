import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "@/lib/auth/session";

const updateMediaSchema = z.object({
  name: z.string().trim().min(1).max(255),
  alt: z.string().trim().max(1000).nullable(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionData = await getServerSession();
  const workspaceId = sessionData?.session.activeOrganizationId;

  if (!sessionData || !workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: "Media ID is required" },
      { status: 400 }
    );
  }

  try {
    const media = await db.media.findFirst({
      where: {
        id,
        workspaceId,
      },
      select: {
        id: true,
        name: true,
        url: true,
        alt: true,
        createdAt: true,
        type: true,
        size: true,
        mimeType: true,
        width: true,
        height: true,
        duration: true,
        blurHash: true,
      },
    });

    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    return NextResponse.json(media, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch media";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionData = await getServerSession();
  const workspaceId = sessionData?.session.activeOrganizationId;

  if (!sessionData || !workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: "Media ID is required" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const parsedBody = updateMediaSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsedBody.error.issues },
      { status: 400 }
    );
  }

  try {
    const existingMedia = await db.media.findFirst({
      where: {
        id,
        workspaceId,
      },
      select: {
        id: true,
      },
    });

    if (!existingMedia) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    const updatedMedia = await db.media.update({
      where: {
        id,
        workspaceId,
      },
      data: parsedBody.data,
      select: {
        id: true,
        name: true,
        url: true,
        alt: true,
        createdAt: true,
        type: true,
        size: true,
        mimeType: true,
        width: true,
        height: true,
        duration: true,
        blurHash: true,
      },
    });

    return NextResponse.json(updatedMedia, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update media";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
