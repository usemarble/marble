"use server";

import { db } from "@marble/db";
import { headers } from "next/headers";
import { auth } from "../auth/auth";
import { getServerSession } from "../auth/session";
import {
  type CreateWorkspaceValues,
  workspaceSchema,
} from "../validations/workspace";

export async function createWorkspaceAction(payload: CreateWorkspaceValues) {
  try {
    const sessionData = await getServerSession();
    if (!sessionData?.user) {
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

export async function _updateWorkspaceAction(
  workspaceId: string,
  payload: CreateWorkspaceValues
) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const parsedPayload = workspaceSchema.parse(payload);

  const workspace = await db.organization.update({
    where: { id: workspaceId },
    data: parsedPayload,
  });

  return workspace;
}

export async function _deleteWorkspaceAction(workspaceId: string) {
  const session = await getServerSession();
  if (!session?.user?.id) {
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
