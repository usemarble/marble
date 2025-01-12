import db from "@repo/db";
import { InviteStatus } from "@repo/db/client";

export async function getWorkspaceMembers(workspaceId: string) {
  const members = await db.member.findMany({
    where: { organizationId: workspaceId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  const invites = await db.invitation.findMany({
    where: {
      organizationId: workspaceId,
      status: InviteStatus.PENDING,
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  return { members, invites };
}
