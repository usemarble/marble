import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "@/lib/auth/session";
import { R2_BUCKET_NAME, r2 } from "@/lib/r2";
import { loadMediaApiFilters } from "@/lib/search-params";
import { DeleteSchema } from "@/lib/validations/upload";
import { dispatchWebhooks } from "@/lib/webhooks/dispatcher";
import { splitMediaSort } from "@/utils/media";

export async function GET(request: Request) {
  const sessionData = await getServerSession();

  if (!sessionData) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const orgId = sessionData.session?.activeOrganizationId;

  if (!orgId) {
    return NextResponse.json(
      { error: "Active workspace not found in session" },
      { status: 400 }
    );
  }

  const filters = loadMediaApiFilters(request, { strict: true });
  if (!z.number().int().min(1).safeParse(filters.page).success) {
    return NextResponse.json({ error: "Invalid page" }, { status: 400 });
  }
  if (!z.number().int().min(1).max(100).safeParse(filters.perPage).success) {
    return NextResponse.json({ error: "Invalid perPage" }, { status: 400 });
  }
  const { field, direction } = splitMediaSort(filters.sort);
  const { page, perPage, search, type } = filters;

  try {
    const hasAnyMedia =
      (await db.media.count({
        where: { workspaceId: orgId },
      })) > 0;

    const where = {
      workspaceId: orgId,
      ...(type && { type }),
      ...(search?.trim() && {
        name: {
          contains: search.trim(),
          mode: "insensitive" as const,
        },
      }),
    };

    const orderBy = [{ [field]: direction }, { id: direction }];

    const [media, totalCount] = await Promise.all([
      db.media.findMany({
        where,
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy,
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
      }),
      db.media.count({ where }),
    ]);

    return NextResponse.json(
      {
        media,
        pageCount: Math.max(1, Math.ceil(totalCount / perPage)),
        totalCount,
        hasAnyMedia,
      },
      { status: 200 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch media";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const sessionData = await getServerSession();

  if (!sessionData || !sessionData.session.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = sessionData.session.activeOrganizationId;

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
              "Invalid storage key: contains empty or traversal path segments."
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

      dispatchWebhooks({
        workspaceId,
        validationEvent: "media_deleted",
        deliveryEvent: "media.deleted",
        payload: mediaDeletedFromR2.map(({ media }) => ({
          id: media.id,
          name: media.name,
          userId: sessionData.user.id,
        })),
      }).catch((error) => {
        console.error("[MediaDelete] Failed to dispatch webhooks:", error);
      });
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
    const message =
      error instanceof Error ? error.message : "Failed to delete media";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
