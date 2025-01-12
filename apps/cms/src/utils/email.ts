import { Resend } from 'resend';
import { VercelInviteUserEmail } from '@/components/emails/invite';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInviteEmail({
  inviteeEmail,
  inviteeUsername,
  inviterName,
  inviterEmail,
  workspaceName,
  inviteLink,
}: {
  inviteeEmail: string;
  inviteeUsername?: string;
  inviterName: string;
  inviterEmail: string;
  workspaceName: string;
  inviteLink: string;
}) {
  return resend.emails.send({
    from: 'Marble <onboarding@resend.dev>',
    to: inviteeEmail,
    subject: `Join ${workspaceName} on Marble`,
    react: VercelInviteUserEmail({
      username: inviteeUsername ?? "User",
      invitedByUsername: inviterName,
      invitedByEmail: inviterEmail,
      teamName: workspaceName,
      inviteLink,
      // You can customize these or get real values
      inviteFromIp: "Unavailable",
      inviteFromLocation: "Unknown",
      userImage: `https://avatar.vercel.sh/${inviteeEmail}`,
      teamImage: `https://avatar.vercel.sh/${workspaceName}`,
    })
  });
}
