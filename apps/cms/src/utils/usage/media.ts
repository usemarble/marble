import { db } from "@marble/db";
import { getWorkspacePlan, PLAN_LIMITS } from "@/lib/plans";
import { createPolarClient } from "@/lib/polar/client";

const BYTES_PER_MB = 1024 * 1024;

/**
 * Returns the total bytes currently stored by media records in a workspace.
 */
export async function getWorkspaceMediaUsageBytes(
  workspaceId: string
): Promise<number> {
  const result = await db.media.aggregate({
    where: { workspaceId },
    _sum: { size: true },
  });

  return result._sum.size ?? 0;
}

/**
 * Returns the active plan's media storage limit for a workspace in bytes.
 */
export async function getWorkspaceMediaStorageLimitBytes(
  workspaceId: string
): Promise<number> {
  const activeSubscription = await db.subscription.findFirst({
    where: {
      workspaceId,
      OR: [
        { status: "active" },
        { status: "trialing" },
        {
          status: "canceled",
          cancelAtPeriodEnd: true,
          currentPeriodEnd: { gt: new Date() },
        },
      ],
    },
    orderBy: { createdAt: "desc" },
    select: {
      plan: true,
      status: true,
      cancelAtPeriodEnd: true,
      currentPeriodEnd: true,
    },
  });

  const plan = getWorkspacePlan(activeSubscription);
  return PLAN_LIMITS[plan].maxMediaStorage * BYTES_PER_MB;
}

/**
 * Checks whether a new stored media upload would fit within workspace storage limits.
 */
export async function canStoreMediaUpload(
  workspaceId: string,
  fileSize: number
): Promise<boolean> {
  const [currentUsage, storageLimit] = await Promise.all([
    getWorkspaceMediaUsageBytes(workspaceId),
    getWorkspaceMediaStorageLimitBytes(workspaceId),
  ]);

  return currentUsage + fileSize <= storageLimit;
}

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
