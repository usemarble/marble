import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { R2_BUCKET_NAME, r2 } from "@/lib/r2";
import { getWebhooks, WebhookClient } from "@/lib/webhooks/webhook-client";

export async function GET() {
  const sessionData = await getServerSession();

  if (!sessionData) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const orgId = sessionData.session?.activeOrganizationId;

  if (!orgId) {
    return NextResponse.json(
      { error: "Active workspace not found in session" },
      { status: 400 },
    );
  }

  const media = await db.media.findMany({
    where: { workspaceId: orgId },
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
  const sessionData = await getServerSession();

  if (!sessionData || !sessionData.session.activeOrganizationId) {
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
        workspaceId: sessionData.session.activeOrganizationId,
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
        const pathname = media.url.startsWith("http")
          ? new URL(media.url).pathname
          : media.url;

        let key = pathname.replace(/^\/+/, "");

        if (key.startsWith(`${R2_BUCKET_NAME}/`)) {
          // Remove leading slash(es)

          // Strip optional bucket prefix if present
          key = key.slice(R2_BUCKET_NAME.length + 1);
        }

        if (!key || key.includes("..") || key.includes("//")) {
          // Sanitize for traversal or empty segments
          throw new Error(
            "Invalid storage key: contains empty or traversal path segments.",
          );
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

    const webhooks = getWebhooks(sessionData.session, "media_deleted");

    for (const webhook of await webhooks) {
      const webhookClient = new WebhookClient({ secret: webhook.secret });
      await webhookClient.send({
        url: webhook.endpoint,
        event: "media.deleted",
        data: {
          id: media.id,
          name: media.name,
          userId: sessionData.user.id,
        },
        format: webhook.format,
      });
    }

    return NextResponse.json({ id: deletedMedia.id }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete media";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
