import { db } from "@marble/db";
import { toMediaPayload } from "@marble/events";
import { NextResponse } from "next/server";
import { requireActiveWorkspaceAccess } from "@/lib/auth/access";
import {
  emitDashboardEvent,
  logDashboardEventError,
} from "@/lib/queues/events";
import { R2_PUBLIC_URL } from "@/lib/r2";
import { verifyUploadToken } from "@/lib/upload-token";
import { completeSchema } from "@/lib/validations/upload";
import { getMediaType } from "@/utils/media";
import { trackMediaUpload } from "@/utils/usage/media";

function getExpectedKeyPrefix({
  type,
  userId,
  workspaceId,
}: {
  type: "avatar" | "logo" | "media";
  userId: string;
  workspaceId: string;
}) {
  switch (type) {
    case "avatar":
      return `avatars/${userId}/`;
    case "logo":
      return `logos/${workspaceId}/`;
    case "media":
      return `media/${workspaceId}/`;
    default:
      return "";
  }
}

export async function POST(request: Request) {
  const accessData = await requireActiveWorkspaceAccess();

  if (!accessData.ok) {
    return accessData.response;
  }

  const { sessionData, workspaceId } = accessData;
  const body = await request.json();
  const parsedBody = completeSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { type, key, fileType, fileSize } = parsedBody.data;

  if (type === "logo" && accessData.member.role !== "owner") {
    return NextResponse.json(
      { error: "Only workspace owners can update the logo" },
      { status: 403 }
    );
  }

  const expectedKeyPrefix = getExpectedKeyPrefix({
    type,
    userId: sessionData.user.id,
    workspaceId,
  });

  if (!key.startsWith(expectedKeyPrefix)) {
    return NextResponse.json({ error: "Invalid upload key" }, { status: 400 });
  }

  if (type === "media") {
    try {
      const tokenPayload = verifyUploadToken(parsedBody.data.token);

      if (
        tokenPayload.workspaceId !== workspaceId ||
        tokenPayload.type !== type ||
        tokenPayload.key !== key
      ) {
        return NextResponse.json(
          { error: "Invalid upload token" },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Invalid upload token" },
        { status: 400 }
      );
    }
  }

  const url = `${R2_PUBLIC_URL}/${key}`;

  try {
    switch (type) {
      case "avatar": {
        return NextResponse.json({ url });
      }
      case "logo": {
        await db.organization.update({
          where: { id: workspaceId },
          data: { logo: url },
        });
        return NextResponse.json({ url });
      }
      case "media": {
        const mediaName = parsedBody.data.name;
        const mediaType = getMediaType(fileType);
        const media = await db.media.create({
          data: {
            name: mediaName,
            url,
            storageKey: key,
            size: fileSize,
            mimeType: parsedBody.data.mimeType ?? fileType,
            width: parsedBody.data.width,
            height: parsedBody.data.height,
            duration: parsedBody.data.duration,
            blurHash: parsedBody.data.blurHash,
            type: mediaType,
            workspaceId,
          },
        });

        trackMediaUpload(workspaceId, fileSize, mediaType).catch((err) => {
          console.error("[Media Upload] Failed to track upload:", err);
        });

        await emitDashboardEvent({
          type: "media_uploaded",
          workspaceId,
          resourceType: "media",
          resourceId: media.id,
          actorId: sessionData.user.id,
          payload: toMediaPayload(media),
        }).catch(logDashboardEventError);

        const mediaResponse = {
          id: media.id,
          name: media.name,
          url: media.url,
          alt: media.alt,
          size: media.size,
          mimeType: media.mimeType,
          width: media.width,
          height: media.height,
          duration: media.duration,
          blurHash: media.blurHash,
          type: media.type,
          createdAt: media.createdAt.toISOString(),
        };
        return NextResponse.json(mediaResponse);
      }
      default:
        return NextResponse.json(
          { error: "Invalid upload type" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error completing upload:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to complete upload";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
