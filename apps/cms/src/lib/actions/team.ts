"use server";

import getSession from "@/lib/auth/session";
import db from "@repo/db";
import { InviteStatus } from "@repo/db/client";
import { sendInviteEmail } from "@/lib/utils/email";

export async function createInviteAction(email: string, workspaceId: string) {
  const session = await getSession();
  if (!session || !session.user?.id) {
    throw new Error("User is not authenticated");
  }

  // Check if user is already a member
  const existingMember = await db.workspaceMember.findFirst({
    where: {
      workspace: { id: workspaceId },
      user: { email },
    },
  });

  if (existingMember) {
    throw new Error("User is already a member of this workspace");
  }

  // Check for existing pending invite
  const existingInvite = await db.invite.findFirst({
    where: {
      email,
      workspaceId,
      status: InviteStatus.PENDING,
    },
  });

  if (existingInvite) {
    throw new Error("An invite is already pending for this email");
  }

  // Create new invite
  const invite = await db.invite.create({
    data: {
      email,
      workspaceId,
      status: InviteStatus.PENDING,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      inviterId: session.user.id,
    },
    include: {
      workspace: true,
      inviter: true,
    }
  });

  // Send invite email
  await sendInviteEmail({
    inviteeEmail: email,
    inviteeUsername: "User", // Simple username from email
    inviterName: invite.inviter.name ?? 'A team member',
    inviterEmail: invite.inviter.email ?? '',
    workspaceName: invite.workspace.name,
    inviteLink: `${process.env.NEXT_PUBLIC_APP_URL}/invite/${invite.id}`,
  });

  return invite;
}
