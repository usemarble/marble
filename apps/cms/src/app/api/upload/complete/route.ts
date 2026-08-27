import { db } from "@marble/drizzle";
import { media, organization } from "@marble/drizzle/schema";
import { toMediaPayload } from "@marble/events";
import { createRecordId } from "@marble/drizzle/create-id";
import { eq } from "@marble/drizzle/operators";
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
        await db
          .update(organization)
          .set({ logo: url, updatedAt: new Date() })
          .where(eq(organization.id, workspaceId));
        return NextResponse.json({ url });
      }
      case "media": {
        const mediaName = parsedBody.data.name;
        const mediaType = getMediaType(fileType);
        const now = new Date();
        const [createdMedia] = await db
          .insert(media)
          .values({
            id: createRecordId(),
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
            createdAt: now,
            updatedAt: now,
          })
          .returning();

        if (!createdMedia) {
          return NextResponse.json(
            { error: "Failed to complete upload" },
            { status: 500 }
          );
        }

        trackMediaUpload(workspaceId, fileSize, mediaType).catch((err) => {
          console.error("[Media Upload] Failed to track upload:", err);
        });

        await emitDashboardEvent({
          type: "media_uploaded",
          workspaceId,
          resourceType: "media",
          resourceId: createdMedia.id,
          actorId: sessionData.user.id,
          payload: toMediaPayload(createdMedia),
        }).catch(logDashboardEventError);

        const mediaResponse = {
          id: createdMedia.id,
          name: createdMedia.name,
          url: createdMedia.url,
          alt: createdMedia.alt,
          size: createdMedia.size,
          mimeType: createdMedia.mimeType,
          width: createdMedia.width,
          height: createdMedia.height,
          duration: createdMedia.duration,
          blurHash: createdMedia.blurHash,
          type: createdMedia.type,
          createdAt: createdMedia.createdAt.toISOString(),
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
