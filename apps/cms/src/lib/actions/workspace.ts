"use server";

import { db } from "@marble/db";
import { headers } from "next/headers";
import { auth } from "../auth/auth";
import { getServerSession } from "../auth/session";
import {
  type CreateWorkspaceValues,
  workspaceSchema,
} from "../validations/workspace";

/**
 * Creates a new workspace and assigns the current user as its owner.
 *
 * Validates the input payload, creates a workspace and membership record in the database, and sets the new workspace as the active organization for the authenticated user.
 *
 * @param payload - The data required to create the workspace
 * @returns The newly created workspace object
 * @throws If the user is not authenticated or if workspace creation fails
 */
export async function createWorkspaceAction(payload: CreateWorkspaceValues) {
  try {
    const sessionData = await getServerSession();
    if (!sessionData || !sessionData?.user) {
      throw new Error("Unauthorized");
    }

    const parsedPayload = workspaceSchema.parse(payload);

    const workspace = await db.organization.create({
      data: {
        ...parsedPayload,
        slug: parsedPayload.slug.toLocaleLowerCase(),
      },
    });

    await db.member.create({
      data: {
        organizationId: workspace.id,
        userId: sessionData.user.id,
        role: "owner",
        createdAt: new Date(),
      },
    });

    console.log("setting active workspace");
    const data = await auth.api.setActiveOrganization({
      headers: await headers(),
      body: {
        organizationId: workspace.id,
        organizationSlug: workspace.slug,
      },
    });
    console.log("active organization set", data);

    return workspace;
  } catch (error) {
    console.error("Error creating workspace:", error);
    throw new Error("Failed to create workspace");
  }
}

/**
 * Updates an existing workspace with new data after validating user authentication and input.
 *
 * @param workspaceId - The unique identifier of the workspace to update
 * @param payload - The new workspace data to apply
 * @returns The updated workspace object
 */
export async function updateWorkspaceAction(
  workspaceId: string,
  payload: CreateWorkspaceValues,
) {
  const session = await getServerSession();
  if (!session?.user || !session?.user.id) {
    throw new Error("Unauthorized");
  }

  const parsedPayload = workspaceSchema.parse(payload);

  const workspace = await db.organization.update({
    where: { id: workspaceId },
    data: parsedPayload,
  });

  return workspace;
}

export async function deleteWorkspaceAction(workspaceId: string) {
  const session = await getServerSession();
  if (!session?.user || !session?.user.id) {
    throw new Error("Unauthorized");
  }

  try {
    const deleted = await db.organization.delete({
      where: {
        id: workspaceId,
      },
    });
    return deleted.id;
  } catch (error) {
    console.error("Error deleting workspace:", error);
    throw new Error("Failed to delete workspace");
  }
}
