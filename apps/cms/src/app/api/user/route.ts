import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";

/**
 * Retrieves the authenticated user's profile, including their role and active workspace details if available.
 *
 * Returns a 401 response if the user is not authenticated, or a 404 response if the user does not exist.
 * If the user has an active organization, includes their role and organization information in the response.
 * Responds with a JSON object containing user data, workspace role, and active workspace details.
 */
export async function GET() {
  const sessionData = await getServerSession();

  if (!sessionData) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: sessionData.user.id },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const activeOrganizationId = sessionData.session
    ?.activeOrganizationId as string;

  let member = null;
  if (activeOrganizationId) {
    member = await db.member.findFirst({
      where: {
        organizationId: activeOrganizationId,
        userId: user.id,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  const userWithRole = {
    ...user,
    workspaceRole: member?.role || null,
    activeWorkspace: member?.organization || null,
  };

  return NextResponse.json(userWithRole, { status: 200 });
}

/**
 * Updates the authenticated user's profile information.
 *
 * Parses the request body for a new name (required) and optional image, updates the user's record, and returns the updated user data along with the user's role and active workspace details if available. Returns appropriate error responses for authentication failure, validation errors, or update failures.
 */
export async function PATCH(request: Request) {
  const sessionData = await getServerSession();

  if (!sessionData) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, image } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const updatedUser = await db.user.update({
      where: { id: sessionData.user.id },
      data: {
        name: name.trim(),
        ...(image && { image }),
      },
    });

    const activeOrganizationId = sessionData.session
      ?.activeOrganizationId as string;

    let member = null;
    if (activeOrganizationId) {
      member = await db.member.findFirst({
        where: {
          organizationId: activeOrganizationId,
          userId: updatedUser.id,
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });
    }

    const userWithRole = {
      ...updatedUser,
      workspaceRole: member?.role || null,
      activeWorkspace: member?.organization || null,
    };

    return NextResponse.json(userWithRole, { status: 200 });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 },
    );
  }
}
