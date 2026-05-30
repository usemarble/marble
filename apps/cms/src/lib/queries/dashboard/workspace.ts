import "server-only";

import { requireWorkspaceAccess } from "@/lib/auth/access";

export async function getDashboardWorkspaceId(workspaceSlug: string) {
  const accessData = await requireWorkspaceAccess(workspaceSlug);
  return accessData.ok ? accessData.workspaceId : null;
}
