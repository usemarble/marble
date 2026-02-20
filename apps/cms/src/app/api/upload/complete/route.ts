import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { R2_PUBLIC_URL } from "@/lib/r2";
import { completeSchema } from "@/lib/validations/upload";
import { dispatchWebhooks } from "@/lib/webhooks/dispatcher";
import { getMediaType } from "@/utils/media";
import { trackMediaUpload } from "@/utils/usage/media";

export async function POST(request: Request) {
  const sessionData = await getServerSession();

  if (!sessionData || !sessionData.session.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = sessionData.session.activeOrganizationId;
  const body = await request.json();
  const parsedBody = completeSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { type, key, fileType, fileSize } = parsedBody.data;
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
            size: fileSize,
            type: mediaType,
            workspaceId,
          },
        });

        trackMediaUpload(workspaceId, fileSize, mediaType).catch((err) => {
          console.error("[Media Upload] Failed to track upload:", err);
        });

        dispatchWebhooks({
          workspaceId,
          validationEvent: "media_uploaded",
          deliveryEvent: "media.uploaded",
          payload: {
            id: media.id,
            name: media.name,
            userId: sessionData.user.id,
            size: media.size,
            type: media.type,
          },
        }).catch((error) => {
          console.error(
            `[MediaUpload] Failed to dispatch webhooks: mediaId=${media.id}`,
            error
          );
        });

        const mediaResponse = {
          id: media.id,
          name: media.name,
          url: media.url,
          size: media.size,
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
