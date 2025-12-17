import { db } from "@marble/db";
import { createPolarClient } from "@/lib/polar/client";

/**
 * Gets the customer ID for a workspace by finding the owner's user ID.
 * Falls back to workspaceId if lookup fails or no owner is found.
 */
export async function getCustomerIdForWorkspace(
  workspaceId: string
): Promise<string> {
  try {
    const organization = await db.organization.findFirst({
      where: { id: workspaceId },
      select: {
        members: {
          where: { role: "owner" },
          select: { userId: true },
          take: 1,
        },
      },
    });

    const ownerUserId =
      organization?.members && organization.members.length > 0
        ? organization.members[0]?.userId
        : undefined;

    return ownerUserId ?? workspaceId;
  } catch (error) {
    console.error("[Media Upload] Failed to get customer ID:", error);
    return workspaceId;
  }
}

/**
 * Tracks media upload in the database by creating a usage event.
 */
export async function trackMediaUploadInDB(
  workspaceId: string,
  fileSize: number
): Promise<void> {
  await db.usageEvent.create({
    data: {
      type: "media_upload",
      workspaceId,
      size: fileSize,
    },
  });
}

/**
 * Tracks media upload in Polar analytics.
 */
export async function trackMediaUploadInPolar(
  customerId: string,
  fileSize: number,
  mediaType: string
): Promise<void> {
  const polarClient = createPolarClient();
  if (!polarClient) {
    return;
  }

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
}

/**
 * Orchestrates all media upload tracking operations.
 * Each operation is independent and failures don't block others.
 */
export async function trackMediaUpload(
  workspaceId: string,
  fileSize: number,
  mediaType: string
): Promise<void> {
  try {
    await trackMediaUploadInDB(workspaceId, fileSize);
  } catch (error) {
    console.error("[Media Upload] Failed to track in DB:", error);
  }

  try {
    const customerId = await getCustomerIdForWorkspace(workspaceId);
    await trackMediaUploadInPolar(customerId, fileSize, mediaType);
  } catch (error) {
    console.error(
      "[Media Upload] Polar ingestion error (events may still be processed):",
      error instanceof Error ? error.message : error
    );
  }
}
