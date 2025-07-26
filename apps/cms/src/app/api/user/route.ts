import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";

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
