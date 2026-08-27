import { db } from "@marble/drizzle";
import { member, workspace } from "@marble/drizzle/schema";
import { and, eq } from "@marble/drizzle/operators";
import { NextResponse } from "next/server";
import { getServerSession } from "./session";

/**
 * Requires access to the workspace currently stored in the Better Auth session.
 *
 * Use this for API routes whose workspace scope is the active organization
 * selected in the user's session, such as dashboard resource endpoints.
 */
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

    const foundMember = await db.query.member.findFirst({
      where: and(
        eq(member.organizationId, workspaceId),
        eq(member.userId, sessionData.user.id)
      ),
      columns: {
        id: true,
        role: true,
        userId: true,
        organizationId: true,
      },
    });

    if (!foundMember) {
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
      member: foundMember,
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

/**
 * Requires access to a workspace resolved from a route slug.
 *
 * Use this for slug-addressed routes where the URL is the source of truth.
 * Missing and unauthorized workspaces intentionally return the same not-found
 * response so callers cannot enumerate valid workspace slugs.
 */
export async function requireWorkspaceAccess(workspaceSlug: string) {
  try {
    const sessionData = await getServerSession();

    if (!sessionData) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "Not authenticated" },
          { status: 401 }
        ),
      } as const;
    }

    const rows = await db
      .select({
        id: member.id,
        role: member.role,
        userId: member.userId,
        organizationId: member.organizationId,
      })
      .from(member)
      .innerJoin(workspace, eq(member.organizationId, workspace.id))
      .where(
        and(
          eq(member.userId, sessionData.user.id),
          eq(workspace.slug, workspaceSlug)
        )
      )
      .limit(1);

    const foundMember = rows[0];

    if (!foundMember) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "Workspace not found" },
          { status: 404 }
        ),
      } as const;
    }

    return {
      ok: true,
      member: foundMember,
      sessionData,
      workspaceId: foundMember.organizationId,
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
