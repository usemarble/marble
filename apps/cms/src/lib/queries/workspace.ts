import db from "@marble/db";

export async function getActiveOrganization(id: string) {
  const workspace = await db.organization.findFirst({
    where: { members: { some: { userId: id } } },
  });

  return workspace;
}

//
export async function getFirstOrganization(userId: string) {
  // First try to find a workspace where user is owner
  const ownerWorkspace = await db.organization.findFirst({
    where: {
      members: {
        some: {
          userId: userId,
          role: "owner",
        },
      },
    },
    select: { slug: true },
  });

  if (ownerWorkspace) {
    return ownerWorkspace.slug;
  }

  // If no owner workspace, check for any workspace user is a member of
  const memberWorkspace = await db.organization.findFirst({
    where: {
      members: {
        some: {
          userId: userId,
        },
      },
    },
    select: { slug: true },
  });

  if (memberWorkspace) {
    return memberWorkspace.slug;
  }
}
