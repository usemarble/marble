"use server";

import getSession from "@/lib/auth/session";
import { sendInviteEmail } from "@/utils/email";
import db from "@repo/db";
import { InviteStatus } from "@repo/db/client";

export async function createInviteAction(email: string, workspaceId: string) {
  const session = await getSession();
  if (!session || !session.user?.id) {
    throw new Error("User is not authenticated");
  }

  // Check if user is already a member
  const existingMember = await db.member.findFirst({
    where: {
      organization: { id: workspaceId },
      user: { email },
    },
  });

  if (existingMember) {
    throw new Error("User is already a member of this workspace");
  }

  // Check for existing pending invite
  const existingInvite = await db.invitation.findFirst({
    where: {
      email,
      organizationId: workspaceId,
      status: InviteStatus.PENDING,
    },
  });

  if (existingInvite) {
    throw new Error("An invite is already pending for this email");
  }

  // Create new invite
  const invite = await db.invitation.create({
    data: {
      email,
      organizationId: workspaceId,
      status: InviteStatus.PENDING,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      inviterId: session.user.id,
    },
    include: {
      organization: true,
      user: true,
    },
  });

  // Send invite email
  await sendInviteEmail({
    inviteeEmail: email,
    inviteeUsername: "User",
    inviterName: invite.user.name ?? "A team member",
    inviterEmail: invite.user.email ?? "",
    workspaceName: invite.organization.name,
    inviteLink: `${process.env.NEXT_PUBLIC_APP_URL}/invite/${invite.id}`,
  });

  return invite;
}
