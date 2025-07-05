import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";

export async function GET() {
  const sessionData = await getServerSession();

  if (!sessionData) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const workspaces = await db.organization.findMany({
    where: {
      members: {
        some: {
          userId: sessionData.user.id,
        },
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      createdAt: true,
      members: {
        where: {
          userId: sessionData.user.id,
        },
        select: {
          id: true,
          role: true,
          createdAt: true,
        },
      },
      subscription: {
        select: {
          id: true,
          status: true,
          plan: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Transform the data to include the user's role directly
  const workspacesWithRole = workspaces.map((workspace) => ({
    ...workspace,
    userRole: workspace.members[0]?.role || null,
    members: undefined, // Remove the members array since we only needed it for the role
  }));

  return NextResponse.json(workspacesWithRole);
}
