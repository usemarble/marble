import { db, createRecordId } from "@marble/drizzle";
import { media, member, usageEvent, workspace } from "@marble/drizzle/schema";

import { and, eq, sum } from "drizzle-orm";
import { getWorkspacePlan, PLAN_LIMITS } from "@/lib/plans";
import { createPolarClient } from "@/lib/polar/client";
import { findActiveWorkspaceSubscriptionPlanFields } from "@/lib/subscription/active-subscription";

const BYTES_PER_MB = 1024 * 1024;

export async function getWorkspaceMediaUsageBytes(
  workspaceId: string
): Promise<number> {
  const [result] = await db
    .select({ total: sum(media.size) })
    .from(media)
    .where(eq(media.workspaceId, workspaceId));

  return Number(result?.total ?? 0);
}

export async function getWorkspaceMediaStorageLimitBytes(
  workspaceId: string
): Promise<number> {
  const activeSubscription =
    await findActiveWorkspaceSubscriptionPlanFields(workspaceId);
  const plan = getWorkspacePlan(activeSubscription);
  return PLAN_LIMITS[plan].maxMediaStorage * BYTES_PER_MB;
}

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

export async function getCustomerIdForWorkspace(
  workspaceId: string
): Promise<string> {
  try {
    const organization = await db.query.workspace.findFirst({
      where: eq(workspace.id, workspaceId),
      with: {
        members: {
          where: eq(member.role, "owner"),
          columns: { userId: true },
          limit: 1,
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

export async function trackMediaUploadInDB(
  workspaceId: string,
  fileSize: number
): Promise<void> {
  await db.insert(usageEvent).values({
    id: createRecordId(),
    type: "media_upload",
    workspaceId,
    size: fileSize,
  });
}

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
