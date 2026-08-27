import { db } from "@marble/drizzle";
import { media } from "@marble/drizzle/schema";
import { and, eq } from "@marble/drizzle/operators";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireActiveWorkspaceAccess } from "@/lib/auth/access";

const updateMediaSchema = z.object({
  name: z.string().trim().min(1).max(255),
  alt: z.string().trim().max(1000).nullable(),
});

const mediaColumns = {
  id: media.id,
  name: media.name,
  url: media.url,
  alt: media.alt,
  createdAt: media.createdAt,
  type: media.type,
  size: media.size,
  mimeType: media.mimeType,
  width: media.width,
  height: media.height,
  duration: media.duration,
  blurHash: media.blurHash,
} as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const accessData = await requireActiveWorkspaceAccess();

  if (!accessData.ok) {
    return accessData.response;
  }

  const { workspaceId } = accessData;

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: "Media ID is required" },
      { status: 400 }
    );
  }

  try {
    const [mediaItem] = await db
      .select(mediaColumns)
      .from(media)
      .where(and(eq(media.id, id), eq(media.workspaceId, workspaceId)))
      .limit(1);

    if (!mediaItem) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    return NextResponse.json(mediaItem, { status: 200 });
  } catch (error) {
    console.error("[Media] Failed to fetch media:", error);
    return NextResponse.json(
      { error: "Failed to fetch media" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const accessData = await requireActiveWorkspaceAccess();

  if (!accessData.ok) {
    return accessData.response;
  }

  const { workspaceId } = accessData;

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: "Media ID is required" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const parsedBody = updateMediaSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsedBody.error.issues },
        { status: 400 }
      );
    }

    const [existingMedia] = await db
      .select({ id: media.id })
      .from(media)
      .where(and(eq(media.id, id), eq(media.workspaceId, workspaceId)))
      .limit(1);

    if (!existingMedia) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    const [updatedMedia] = await db
      .update(media)
      .set({
        ...parsedBody.data,
        updatedAt: new Date(),
      })
      .where(eq(media.id, id))
      .returning(mediaColumns);

    if (!updatedMedia) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    return NextResponse.json(updatedMedia, { status: 200 });
  } catch (error) {
    console.error("[Media] Failed to update media:", error);
    return NextResponse.json(
      { error: "Failed to update media" },
      { status: 500 }
    );
  }
}
