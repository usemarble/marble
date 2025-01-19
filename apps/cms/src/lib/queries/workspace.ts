import db from "@repo/db";
import { InviteStatus } from "@repo/db/client";

export async function getActiveOrganization(id: string) {
  const workspace = await db.organization.findFirst({
    where: { members: { some: { userId: id } } },
  });

  return workspace;
}
