import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@marble/db";
import { toMediaPayload } from "@marble/events";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireActiveWorkspaceAccess } from "@/lib/auth/access";
import {
  emitDashboardEvent,
  logDashboardEventError,
} from "@/lib/events/dispatch";
import { getDashboardMedia } from "@/lib/queries/dashboard/media";
import { R2_BUCKET_NAME, r2 } from "@/lib/r2";
import { loadMediaApiFilters } from "@/lib/search-params";
import { DeleteSchema } from "@/lib/validations/upload";

export async function GET(request: Request) {
  const accessData = await requireActiveWorkspaceAccess();

  if (!accessData.ok) {
    return accessData.response;
  }

  const { workspaceId } = accessData;

  const filters = loadMediaApiFilters(request, { strict: true });
  if (!z.number().int().min(1).safeParse(filters.page).success) {
    return NextResponse.json({ error: "Invalid page" }, { status: 400 });
  }
  if (!z.number().int().min(1).max(100).safeParse(filters.perPage).success) {
    return NextResponse.json({ error: "Invalid perPage" }, { status: 400 });
  }
  try {
    return NextResponse.json(await getDashboardMedia(workspaceId, filters), {
      status: 200,
    });
  } catch (error) {
    console.error("[Media] Failed to fetch media:", error);
    return NextResponse.json(
      { error: "Failed to fetch media" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const accessData = await requireActiveWorkspaceAccess();

  if (!accessData.ok) {
    return accessData.response;
  }

  const { sessionData, workspaceId } = accessData;

  const parsedBody = await request.json();

  const parsed = DeleteSchema.safeParse(parsedBody);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const { mediaIds } = parsed.data;

  try {
    const deletedIds: string[] = [];
    const failedIds: string[] = [];

    const existingMedia = await db.media.findMany({
      where: {
        id: { in: mediaIds },
        workspaceId,
      },
    });

    const existingIds = existingMedia.map((media) => media.id);
    for (const id of mediaIds) {
      if (!existingIds.includes(id)) {
        failedIds.push(id);
      }
    }

    const mediaDeletedFromR2: Array<{
      id: string;
      media: (typeof existingMedia)[0];
    }> = [];

    for (const media of existingMedia) {
      if (media.url) {
        try {
          const rawPath = media.storageKey;
          let key = decodeURIComponent(rawPath).replace(/^\/+/, "");
          if (key.startsWith(`${R2_BUCKET_NAME}/`)) {
            key = key.slice(R2_BUCKET_NAME.length + 1);
          }
          key = key.replace(/\/{2,}/g, "/");
          if (
            !key ||
            !key.startsWith("media/") ||
            key.split("/").some((seg) => ["", ".", ".."].includes(seg))
          ) {
            throw new Error(
              "Invalid storage key: must be a safe media object key."
            );
          }
          await r2.send(
            new DeleteObjectCommand({
              Bucket: R2_BUCKET_NAME,
              Key: key,
            })
          );
          mediaDeletedFromR2.push({ id: media.id, media });
        } catch (error) {
          console.error(
            `Failed to delete media object from R2 for media ID ${media.id}. URL: ${media.url}`,
            error
          );
          failedIds.push(media.id);
        }
      } else {
        console.error(
          `Media with ID ${media.id} has no URL. Deleting database record only.`
        );
        mediaDeletedFromR2.push({ id: media.id, media });
      }
    }

    if (mediaDeletedFromR2.length > 0) {
      await db.media.deleteMany({
        where: {
          id: { in: mediaDeletedFromR2.map((item) => item.id) },
        },
      });

      deletedIds.push(...mediaDeletedFromR2.map((item) => item.id));

      for (const { media } of mediaDeletedFromR2) {
        await emitDashboardEvent({
          type: "media_deleted",
          workspaceId,
          resourceType: "media",
          resourceId: media.id,
          actorId: sessionData.user.id,
          payload: toMediaPayload(media),
        }).catch(logDashboardEventError);
      }
    }

    if (deletedIds.length === 0) {
      return NextResponse.json(
        { error: "No media items were deleted successfully" },
        { status: 500 }
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
      { status: 200 }
    );
  } catch (error) {
    console.error("[Media] Failed to delete media:", error);
    return NextResponse.json(
      { error: "Failed to delete media" },
      { status: 500 }
    );
  }
}
