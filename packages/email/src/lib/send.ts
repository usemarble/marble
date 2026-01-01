import type { Resend } from "resend";
import { InviteUserEmail } from "../components/invite";
import { ResetPasswordEmail } from "../components/reset";
import { VerifyUserEmail } from "../components/verify";
import { WelcomeEmail } from "../components/welcome";

interface SendInviteEmailProps {
  inviteeEmail: string;
  inviteeUsername?: string;
  inviterName: string;
  inviterEmail: string;
  workspaceName: string;
  inviteLink: string;
  teamLogo?: string | null;
}

export async function sendInviteEmail(
  resend: Resend,
  {
    inviteeEmail,
    inviterName,
    inviterEmail,
    workspaceName,
    inviteLink,
    teamLogo,
  }: SendInviteEmailProps
) {
  return await resend.emails.send({
    from: "Marble <emails@marblecms.com>",
    to: inviteeEmail,
    subject: `Join ${workspaceName} on Marble`,
    react: InviteUserEmail({
      inviteeEmail,
      invitedByUsername: inviterName,
      invitedByEmail: inviterEmail,
      teamName: workspaceName,
      inviteLink,
      userImage: `https://api.dicebear.com/9.x/notionists-neutral/svg?seed=${inviteeEmail}`,
      teamImage:
        teamLogo ||
        `https://api.dicebear.com/9.x/glass/svg?seed=${workspaceName}`,
    }),
  });
}

export async function sendVerificationEmail(
  resend: Resend,
  {
    userEmail,
    otp,
    type,
  }: {
    userEmail: string;
    otp: string;
    type: "sign-in" | "email-verification" | "forget-password";
  }
) {
  return await resend.emails.send({
    from: "Marble <emails@marblecms.com>",
    to: userEmail,
    subject: "Verify your email address",
    react: VerifyUserEmail({
      userEmail,
      otp,
      type,
    }),
  });
}

export async function sendResetPassword(
  resend: Resend,
  {
    userEmail,
    resetLink,
  }: {
    userEmail: string;
    resetLink: string;
  }
) {
  return await resend.emails.send({
    from: "Marble <emails@marblecms.com>",
    to: userEmail,
    subject: "Reset Your Password",
    react: ResetPasswordEmail({
      userEmail,
      resetLink,
    }),
  });
}

export async function sendWelcomeEmail(
  resend: Resend,
  {
    userEmail,
  }: {
    userEmail: string;
  }
) {
  return await resend.emails.send({
    from: "Marble <emails@marblecms.com>",
    to: userEmail,
    subject: "Welcome to Marble!",
    react: WelcomeEmail({
      userEmail,
    }),
  });
}
