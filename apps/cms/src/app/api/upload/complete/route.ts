import { db } from "@marble/db";
import { Polar } from "@polar-sh/sdk";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { R2_PUBLIC_URL } from "@/lib/r2";
import { completeSchema } from "@/lib/validations/upload";
import type { MediaType } from "@/types/media";
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

            if (process.env.POLAR_ACCESS_TOKEN) {
              const polar = new Polar({
                accessToken: process.env.POLAR_ACCESS_TOKEN,
                server:
                  process.env.NODE_ENV === "production"
                    ? "production"
                    : "sandbox",
              });

              try {
                await polar.events.ingest({
                  events: [
                    {
                      name: "media_upload",
                      externalCustomerId: workspaceId,
                      metadata: {
                        size: fileSize,
                        type: mediaType,
                      },
                    },
                  ],
                });
              } catch (polarError) {
                // Polar sometimes returns 500 but still processes events (in dev)
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

        // Run tracking asynchronously to not block response)
        trackMediaUpload().catch((err) => {
          console.error("[Media Upload] Failed to track upload:", err);
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
