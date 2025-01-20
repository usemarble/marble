import db from "@repo/db";

export async function getActiveOrganization(id: string) {
  const workspace = await db.organization.findFirst({
    where: { members: { some: { userId: id } } },
  });

  return workspace;
}
