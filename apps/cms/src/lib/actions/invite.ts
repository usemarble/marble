"use server";

import { db } from "@marble/db";
import { getServerSession } from "@/lib/auth/session";

/**
 * Verify an invite
 * @param inviteId - The invite ID
 * @returns The invite email
 */
export async function verifyInvite(inviteId: string) {
  const session = await getServerSession();
  const invite = await db.invitation.findUnique({
    where: { id: inviteId, email: session?.user.email },
    select: { email: true, status: true, expiresAt: true },
  });

  if (!invite) {
    throw new Error("Invite not found");
  }

  if (invite.status !== "pending") {
    throw new Error("Invite is no longer valid");
  }

  if (invite.expiresAt < new Date()) {
    throw new Error("Invite has expired");
  }

  return invite.email;
}
