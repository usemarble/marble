"use server";

import getSession from "@/lib/auth/session";
import db from "@repo/db";
import { InviteStatus } from "@repo/db/client";

export async function verifyInvite(inviteId: string) {
  const invite = await db.invite.findUnique({
    where: { id: inviteId },
    include: {
      workspace: true,
    },
  });

  if (!invite) {
    throw new Error("Invite not found");
  }

  if (invite.status !== InviteStatus.PENDING) {
    throw new Error("Invite is no longer valid");
  }

  if (invite.expiresAt < new Date()) {
    throw new Error("Invite has expired");
  }

  return invite;
}

export async function acceptInvite(inviteId: string) {
  const session = await getSession();
  if (!session?.user?.id || !session?.user?.email) {
    throw new Error("User not authenticated");
  }

  const invite = await verifyInvite(inviteId);

  // Verify the authenticated user's email matches the invite
  if (session.user.email !== invite.email) {
    throw new Error("This invite is for a different email address");
  }

  try {
    // Create workspace member and update invite status
    await db.$transaction([
      db.workspaceMember.create({
        data: {
          userId: session.user.id, // Now TypeScript knows this is always a string
          workspaceId: invite.workspaceId,
          role: 'MEMBER',
        },
      }),
      db.invite.update({
        where: { id: inviteId },
        data: { 
          status: InviteStatus.ACCEPTED,
        },
      }),
    ]);

    return invite.workspace;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      throw new Error("You are already a member of this workspace");
    }
    throw error;
  }
}
