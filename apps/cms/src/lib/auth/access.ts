import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { getServerSession } from "./session";

export async function requireActiveWorkspaceAccess() {
  try {
    const sessionData = await getServerSession();
    const workspaceId = sessionData?.session.activeOrganizationId;

    if (!sessionData || !workspaceId) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "Not authenticated" },
          { status: 401 }
        ),
      } as const;
    }

    const member = await db.member.findFirst({
      where: {
        organizationId: workspaceId,
        userId: sessionData.user.id,
      },
      select: {
        id: true,
        role: true,
        userId: true,
        organizationId: true,
      },
    });

    if (!member) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "You no longer have access to this workspace" },
          { status: 403 }
        ),
      } as const;
    }

    return {
      ok: true,
      member,
      sessionData,
      workspaceId,
    } as const;
  } catch (error) {
    console.error("Error requiring workspace access", error);

    return {
      ok: false,
      response: NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      ),
    } as const;
  }
}
