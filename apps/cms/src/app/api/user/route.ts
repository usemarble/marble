import { db } from "@marble/drizzle";
import { member, user } from "@marble/drizzle/schema";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireActiveWorkspaceAccess } from "@/lib/auth/access";

async function getUserWithWorkspaceRole(userId: string, workspaceId: string) {
  const foundUser = await db.query.user.findFirst({
    where: eq(user.id, userId),
    columns: {
      id: true,
      name: true,
      email: true,
      image: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!foundUser) {
    return null;
  }

  const foundMember = await db.query.member.findFirst({
    where: and(
      eq(member.userId, userId),
      eq(member.organizationId, workspaceId)
    ),
    columns: {
      role: true,
    },
    with: {
      organization: {
        columns: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  return {
    ...foundUser,
    workspaceRole: foundMember?.role || null,
    activeWorkspace: foundMember?.organization || null,
  };
}

export async function GET() {
  const accessData = await requireActiveWorkspaceAccess();

  if (!accessData.ok) {
    return accessData.response;
  }

  const { sessionData, workspaceId } = accessData;

  const userWithRole = await getUserWithWorkspaceRole(
    sessionData.user.id,
    workspaceId
  );

  if (!userWithRole) {
    return NextResponse.json(null, { status: 401 });
  }

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

    const updateData: { name?: string; image?: string; updatedAt: Date } = {
      updatedAt: new Date(),
    };

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

    await db
      .update(user)
      .set(updateData)
      .where(eq(user.id, sessionData.user.id));

    const userWithRole = await getUserWithWorkspaceRole(
      sessionData.user.id,
      workspaceId
    );

    if (!userWithRole) {
      return NextResponse.json(null, { status: 401 });
    }

    return NextResponse.json(userWithRole, { status: 200 });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
