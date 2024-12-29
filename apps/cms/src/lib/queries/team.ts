import db from "@repo/db";
import { InviteStatus } from "@repo/db/client";

export async function getWorkspaceMembers(workspaceId: string) {
  const members = await db.workspaceMember.findMany({
    where: { workspaceId },
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

  const invites = await db.invite.findMany({
    where: {
      workspaceId,
      status: InviteStatus.PENDING,
    },
    include: {
      inviter: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  return { members, invites };
}