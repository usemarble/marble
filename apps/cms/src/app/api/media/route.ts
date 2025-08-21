import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { R2_BUCKET_NAME, r2 } from "@/lib/r2";

export async function GET() {
  const sessionData = await getServerSession();

  if (!sessionData) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const media = await db.media.findMany({
    where: { workspaceId: sessionData.session?.activeOrganizationId as string },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      url: true,
      createdAt: true,
      type: true,
      size: true,
    },
  });

  return NextResponse.json(media, { status: 200 });
}

export async function DELETE(request: Request) {
  const sessionInfo = await getServerSession();
  if (!sessionInfo) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { mediaId } = await request.json();

  if (!mediaId) {
    return NextResponse.json({ error: "mediaId is required" }, { status: 400 });
  }

  try {
    const media = await db.media.findUnique({
      where: {
        id: mediaId,
        workspaceId: sessionInfo.session.activeOrganizationId as string,
      },
    });

    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    if (!media.url) {
      console.error(
        `Media with ID ${media.id} has no URL. Deleting database record only.`,
      );
    } else {
      try {
        const url = new URL(media.url);
        const key = url.pathname.substring(1); // Remove leading '/'

        if (!key) {
          throw new Error("Could not extract key from media URL.");
        }

        await r2.send(
          new DeleteObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
          }),
        );
      } catch (error) {
        console.error(
          `Failed to delete media object from R2 for media ID ${media.id}. URL: ${media.url}`,
          error,
        );
        return NextResponse.json(
          { error: "Failed to delete media from storage." },
          { status: 500 },
        );
      }
    }

    const deletedMedia = await db.media.delete({
      where: {
        id: mediaId,
      },
    });

    return NextResponse.json({ success: true, id: deletedMedia.id });
  } catch (error) {
    console.error("Error deleting media:", error);
    const message =
      error instanceof Error ? error.message : "Failed to delete media";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
