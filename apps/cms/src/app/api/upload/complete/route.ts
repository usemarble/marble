import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { createPolarClient } from "@/lib/polar/client";
import { R2_PUBLIC_URL } from "@/lib/r2";
import { completeSchema } from "@/lib/validations/upload";
import { dispatchWebhooks } from "@/lib/webhooks/dispatcher";
import { getMediaType } from "@/utils/media";

export async function POST(request: Request) {
  const sessionData = await getServerSession();

  if (!sessionData || !sessionData.session.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
        const userId = sessionData.session.userId;
        await db.user.update({
          where: { id: userId },
          data: { image: url },
        });
        return NextResponse.json({ avatarUrl: url });
      }
      case "author-avatar": {
        return NextResponse.json({ avatarUrl: url });
      }
      case "logo": {
        const workspaceId = sessionData.session.activeOrganizationId;
        await db.organization.update({
          where: { id: workspaceId },
          data: { logo: url },
        });
        return NextResponse.json({ logoUrl: url });
      }
      case "media": {
        const mediaName = parsedBody.data.name;
        const workspaceId = sessionData.session.activeOrganizationId;
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

        const trackMediaUpload = async () => {
          try {
            await db.usageEvent.create({
              data: {
                type: "media_upload",
                workspaceId,
                size: fileSize,
              },
            });

            let customerId = workspaceId;
            try {
              if (sessionData.session.activeOrganizationId) {
                const organization = await db.organization.findFirst({
                  where: {
                    id: sessionData.session.activeOrganizationId,
                  },
                  select: {
                    id: true,
                    members: {
                      where: {
                        role: "owner",
                      },
                      select: {
                        userId: true,
                      },
                    },
                  },
                });
                if (organization?.members[0]?.userId) {
                  customerId = organization.members[0].userId;
                }
              }
            } catch (error) {
              console.error("[Media Upload] Failed to get customer ID:", error);
            }

            const polarClient = createPolarClient();
            if (polarClient) {
              try {
                await polarClient.events.ingest({
                  events: [
                    {
                      name: "media_upload",
                      externalCustomerId: customerId,
                      metadata: {
                        size: fileSize,
                        type: mediaType,
                      },
                    },
                  ],
                });
              } catch (polarError) {
                console.error(
                  "[Media Upload] Polar ingestion error (events may still be processed):",
                  polarError instanceof Error ? polarError.message : polarError
                );
              }
            }
          } catch (err) {
            console.error("[Media Upload] Error tracking upload:", err);
          }
        };

        trackMediaUpload().catch((err) => {
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
