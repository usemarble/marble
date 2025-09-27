import { db } from "@marble/db";
import { headers as nextHeaders } from "next/headers";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";

export async function GET() {
  const sessionData = await getServerSession();
  const orgId = sessionData?.session?.activeOrganizationId;

  if (!sessionData || !sessionData.user || !orgId) {
    return NextResponse.json(null, { status: 401 });
  }

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
          organizationId: orgId,
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
  const sessionData = await getServerSession();
  const orgId = sessionData?.session?.activeOrganizationId;

  if (!sessionData || !orgId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

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
            organizationId: orgId,
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
