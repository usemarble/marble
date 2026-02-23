import type { Resend } from "resend";
import { FounderEmail } from "../emails/founder";
import { InviteUserEmail } from "../emails/invite";
import { ResetPasswordEmail } from "../emails/reset";
import { UsageLimitEmail } from "../emails/usage-limit";
import { VerifyUserEmail } from "../emails/verify";
import { WelcomeEmail } from "../emails/welcome";
import { EMAIL_CONFIG } from "./config";

interface SendInviteEmailProps {
  inviteeEmail: string;
  inviteeUsername?: string;
  inviterName: string;
  inviterEmail: string;
  workspaceName: string;
  inviteLink: string;
}

export async function sendInviteEmail(
  resend: Resend,
  {
    inviteeEmail,
    inviterName,
    inviterEmail,
    workspaceName,
    inviteLink,
  }: SendInviteEmailProps
) {
  return await resend.emails.send({
    from: EMAIL_CONFIG.from,
    replyTo: EMAIL_CONFIG.replyTo,
    to: inviteeEmail,
    subject: `Join ${workspaceName} on Marble`,
    react: InviteUserEmail({
      inviteeEmail,
      invitedByUsername: inviterName,
      invitedByEmail: inviterEmail,
      workspaceName,
      inviteLink,
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
    from: EMAIL_CONFIG.from,
    replyTo: EMAIL_CONFIG.replyTo,
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
    from: EMAIL_CONFIG.from,
    replyTo: EMAIL_CONFIG.replyTo,
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
    from: EMAIL_CONFIG.from,
    replyTo: EMAIL_CONFIG.replyTo,
    to: userEmail,
    subject: "Welcome to Marble!",
    react: WelcomeEmail({
      userEmail,
      baseUrl: EMAIL_CONFIG.getAppUrl(),
    }),
  });
}

export async function sendUsageLimitEmail(
  resend: Resend,
  {
    userEmail,
    userName,
    featureName = "Webhooks",
    usageAmount,
    limitAmount,
    workspaceId,
  }: {
    userEmail: string;
    userName?: string;
    featureName?: string;
    usageAmount: number;
    limitAmount: number;
    workspaceId?: string;
  }
) {
  return await resend.emails.send({
    from: EMAIL_CONFIG.from,
    replyTo: EMAIL_CONFIG.replyTo,
    to: userEmail,
    subject: `You're approaching your ${featureName} limit`,
    react: UsageLimitEmail({
      userName,
      featureName,
      usageAmount,
      limitAmount,
      workspaceId,
    }),
  });
}

export async function sendFounderEmail(
  resend: Resend,
  {
    userEmail,
    scheduledAt,
  }: {
    userEmail: string;
    scheduledAt?: Date;
  }
) {
  return await resend.emails.send({
    from: EMAIL_CONFIG.founderFrom,
    replyTo: EMAIL_CONFIG.founderReplyTo,
    to: userEmail,
    subject: "A note from Marble's creator",
    react: FounderEmail({
      userEmail,
    }),
    ...(scheduledAt && { scheduledAt: scheduledAt.toISOString() }),
  });
}
