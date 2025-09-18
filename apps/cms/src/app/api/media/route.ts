import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { R2_BUCKET_NAME, r2 } from "@/lib/r2";
import { DeleteSchema } from "@/lib/validations/upload";
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
      alt: true,
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

  const parsedBody = await request.json();

  const parsed = DeleteSchema.safeParse(parsedBody);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const { mediaId, mediaIds } = await parsed.data;

  const idsToDelete = mediaIds || (mediaId ? [mediaId] : []);

  if (idsToDelete.length === 0) {
    return NextResponse.json(
      { error: "mediaId or mediaIds is required" },
      { status: 400 },
    );
  }

  try {
    const deletedIds: string[] = [];
    const failedIds: string[] = [];

    const existingMedia = await db.media.findMany({
      where: {
        id: { in: idsToDelete },
        workspaceId: sessionData.session.activeOrganizationId,
      },
    });

    const existingIds = existingMedia.map((media) => media.id);
    for (const id of idsToDelete) {
      if (!existingIds.includes(id)) {
        failedIds.push(id);
      }
    }

    const successfullyDeletedFromR2: Array<{
      id: string;
      media: (typeof existingMedia)[0];
    }> = [];

    for (const media of existingMedia) {
      if (!media.url) {
        console.error(
          `Media with ID ${media.id} has no URL. Deleting database record only.`,
        );
        successfullyDeletedFromR2.push({ id: media.id, media });
      } else {
        try {
          const rawPath = media.url.startsWith("http")
            ? new URL(media.url).pathname
            : media.url;
          let key = decodeURIComponent(rawPath).replace(/^\/+/, "");
          if (key.startsWith(`${R2_BUCKET_NAME}/`)) {
            key = key.slice(R2_BUCKET_NAME.length + 1);
          }
          key = key.replace(/\/{2,}/g, "/");
          if (
            !key ||
            key.split("/").some((seg) => ["", ".", ".."].includes(seg))
          ) {
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
          successfullyDeletedFromR2.push({ id: media.id, media });
        } catch (error) {
          console.error(
            `Failed to delete media object from R2 for media ID ${media.id}. URL: ${media.url}`,
            error,
          );
          failedIds.push(media.id);
        }
      }
    }

    if (successfullyDeletedFromR2.length > 0) {
      await db.media.deleteMany({
        where: {
          id: { in: successfullyDeletedFromR2.map((item) => item.id) },
        },
      });

      for (const { media } of successfullyDeletedFromR2) {
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
        deletedIds.push(media.id);
      }
    }

    if (deletedIds.length === 0) {
      return NextResponse.json(
        { error: "No media items were deleted successfully" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        deletedIds,
        failedIds: failedIds.length > 0 ? failedIds : undefined,
        message:
          failedIds.length > 0
            ? `Deleted ${deletedIds.length} items, ${failedIds.length} failed`
            : `Deleted ${deletedIds.length} items successfully`,
      },
      { status: 200 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete media";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const sessionData = await getServerSession();

  if (!sessionData || !sessionData.session.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, alt } = body as { id?: string; alt?: string | null };

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 },
      );
    }

    const updated = await db.media.update({
      where: {
        id,
        workspaceId: sessionData.session.activeOrganizationId,
      },
      data: { alt: alt ?? null },
      select: {
        id: true,
        name: true,
        url: true,
        alt: true,
        createdAt: true,
        type: true,
        size: true,
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update media";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
