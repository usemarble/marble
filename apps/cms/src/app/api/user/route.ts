import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { requireActiveWorkspaceAccess } from "@/lib/auth/access";

export async function GET() {
  const accessData = await requireActiveWorkspaceAccess();

  if (!accessData.ok) {
    return accessData.response;
  }

  const { sessionData, workspaceId } = accessData;

  const user = await db.user.findUnique({
    where: { id: sessionData.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
      members: {
        where: {
          organizationId: workspaceId,
        },
        select: {
          role: true,
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        take: 1,
      },
    },
  });

  if (!user) {
    return NextResponse.json(null, { status: 401 });
  }

  const userWithRole = {
    ...user,
    workspaceRole: user.members[0]?.role || null,
    activeWorkspace: user.members[0]?.organization || null,
    members: undefined,
  };

  return NextResponse.json(userWithRole, { status: 200 });
}

export async function PATCH(request: Request) {
  const accessData = await requireActiveWorkspaceAccess();

  if (!accessData.ok) {
    return accessData.response;
  }

  const { sessionData, workspaceId } = accessData;

  try {
    const body = await request.json();
    const { name, image } = body;

    const updateData: { name?: string; image?: string } = {};

    if (
      name !== undefined &&
      typeof name === "string" &&
      name.trim().length > 0
    ) {
      updateData.name = name.trim();
    }

    if (image !== undefined && typeof image === "string") {
      updateData.image = image;
    }

    const updatedUser = await db.user.update({
      where: { id: sessionData.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        members: {
          where: {
            organizationId: workspaceId,
          },
          select: {
            role: true,
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
          take: 1,
        },
      },
    });

    const userWithRole = {
      ...updatedUser,
      workspaceRole: updatedUser.members[0]?.role || null,
      activeWorkspace: updatedUser.members[0]?.organization || null,
      members: undefined,
    };

    return NextResponse.json(userWithRole, { status: 200 });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
