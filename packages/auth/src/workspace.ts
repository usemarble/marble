import type { DbClient } from "@marble/db";
import { member, workspace } from "@marble/db/schema";
import { and, eq } from "drizzle-orm";

/**
 * Determines which workspace should be activated for a given user.
 *
 * The function checks, in order:
 *  1. The user's **last visited workspace**, if a slug is given,
 *     verifying they still have access to it.
 *  2. If not found or access was lost, the first workspace where the user is an **owner**.
 *  3. If still none, the first workspace where the user is a **member**.
 *
 * @param db - Database client to query with.
 * @param userId - The ID of the user to look up workspaces for.
 * @param lastVisitedSlug - Slug from the last-visited-workspace cookie, if any.
 * @returns `{ slug, id }` for the selected workspace, or `undefined` if the user has no accessible workspaces.
 */
export async function findWorkspaceToActivate(
  db: DbClient,
  userId: string,
  lastVisitedSlug?: string
) {
  if (lastVisitedSlug) {
    const rows = await db
      .select({ slug: workspace.slug, id: workspace.id })
      .from(workspace)
      .innerJoin(member, eq(member.organizationId, workspace.id))
      .where(
        and(eq(workspace.slug, lastVisitedSlug), eq(member.userId, userId))
      )
      .limit(1);

    const foundWorkspace = rows.at(0);
    if (foundWorkspace) {
      return {
        slug: foundWorkspace.slug,
        id: foundWorkspace.id,
      };
    }
  }

  const ownerRows = await db
    .select({ slug: workspace.slug, id: workspace.id })
    .from(workspace)
    .innerJoin(member, eq(member.organizationId, workspace.id))
    .where(and(eq(member.userId, userId), eq(member.role, "owner")))
    .limit(1);

  const ownerWorkspace = ownerRows.at(0);
  if (ownerWorkspace) {
    return {
      slug: ownerWorkspace.slug,
      id: ownerWorkspace.id,
    };
  }

  const memberRows = await db
    .select({ slug: workspace.slug, id: workspace.id })
    .from(workspace)
    .innerJoin(member, eq(member.organizationId, workspace.id))
    .where(eq(member.userId, userId))
    .limit(1);

  const memberWorkspace = memberRows.at(0);
  if (memberWorkspace) {
    return {
      slug: memberWorkspace.slug,
      id: memberWorkspace.id,
    };
  }
}
