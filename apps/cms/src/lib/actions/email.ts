"use server";

import {
  sendDevEmail,
  sendFounderEmail,
  sendInviteEmail,
  sendResetPassword,
  sendUsageLimitEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
} from "@marble/email";
import { Resend } from "resend";
import { getServerSession } from "../auth/session";

const resendApiKey = process.env.RESEND_API_KEY;
const isDevelopment = process.env.NODE_ENV === "development";
const resend = resendApiKey ? new Resend(resendApiKey) : null;

interface SendInviteEmailProps {
  inviteeEmail: string;
  inviteeUsername?: string;
  inviterName: string;
  inviterEmail: string;
  workspaceName: string;
  inviteLink: string;
}

export async function sendInviteEmailAction({
  inviteeEmail,
  inviterName,
  inviterEmail,
  workspaceName,
  inviteLink,
}: SendInviteEmailProps) {
  if (!resend && isDevelopment) {
    return sendDevEmail({
      from: "Marble <emails@marblecms.com>",
      to: inviteeEmail,
      subject: `Join ${workspaceName} on Marble`,
      text: "This is a mock invite email",
      _mockContext: {
        type: "invite",
        data: {
          inviteeEmail,
          inviterName,
          inviterEmail,
          workspaceName,
          inviteLink,
        },
      },
    });
  }

  const session = await getServerSession();

  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  if (!resend) {
    throw new Error("Resend API key not set");
  }

  try {
    await sendInviteEmail(resend, {
      inviteeEmail,
      inviterName,
      inviterEmail,
      workspaceName,
      inviteLink,
    });

    return { success: true, message: "Email sent successfully" };
  } catch (error) {
    console.error("Detailed error sending email:", error);
    return { success: false, error: "Failed to send email" };
  }
}

export async function sendVerificationEmailAction({
  userEmail,
  otp,
  type,
}: {
  userEmail: string;
  otp: string;
  type: "sign-in" | "email-verification" | "forget-password";
}) {
  if (!resend && isDevelopment) {
    return sendDevEmail({
      from: "Marble <emails@marblecms.com>",
      to: userEmail,
      text: "This is a mock verification email",
      subject: "Verify your email address",
      _mockContext: {
        type: "verification",
        data: { userEmail, otp, verificationType: type },
      },
    });
  }

  if (!resend) {
    throw new Error("Resend API key not set");
  }

  try {
    await sendVerificationEmail(resend, {
      userEmail,
      otp,
      type,
    });

    return { success: true, message: "Email sent successfully" };
  } catch (error) {
    console.error("Detailed error sending email:", error);
    return { success: false, error: "Failed to send email" };
  }
}

export async function sendResetPasswordAction({
  userEmail,
  resetLink,
}: {
  userEmail: string;
  resetLink: string;
}) {
  if (!resend && isDevelopment) {
    return sendDevEmail({
      from: "Marble <emails@marblecms.com>",
      to: userEmail,
      text: "This is a mock reset password email",
      subject: "Reset Your Password",
      _mockContext: { type: "reset", data: { userEmail, resetLink } },
    });
  }

  if (!resend) {
    throw new Error("Resend API key not set");
  }

  try {
    await sendResetPassword(resend, {
      userEmail,
      resetLink,
    });

    return { success: true, message: "Email sent successfully" };
  } catch (error) {
    console.error("Detailed error sending email:", error);
    return { success: false, error: "Failed to send email" };
  }
}

export async function sendWelcomeEmailAction({
  userEmail,
}: {
  userEmail: string;
}) {
  if (!resend && isDevelopment) {
    return sendDevEmail({
      from: "Marble <emails@marblecms.com>",
      to: userEmail,
      text: "This is a mock welcome email",
      subject: "Welcome to Marble!",
      _mockContext: { type: "welcome", data: { userEmail } },
    });
  }

  if (!resend) {
    throw new Error("Resend API key not set");
  }

  try {
    await sendWelcomeEmail(resend, {
      userEmail,
    });

    return { success: true, message: "Email sent successfully" };
  } catch (error) {
    console.error("Detailed error sending email:", error);
    return { success: false, error: "Failed to send email" };
  }
}

export async function sendUsageLimitEmailAction({
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
}) {
  if (!resend && isDevelopment) {
    return sendDevEmail({
      from: "Marble <emails@marblecms.com>",
      to: userEmail,
      text: `This is a mock usage limit email for ${featureName}`,
      subject: `You're approaching your ${featureName} limit`,
      _mockContext: {
        type: "usage-limit",
        data: {
          userEmail,
          userName,
          featureName,
          usageAmount,
          limitAmount,
          workspaceId,
        },
      },
    });
  }

  if (!resend) {
    throw new Error("Resend API key not set");
  }

  try {
    await sendUsageLimitEmail(resend, {
      userEmail,
      userName,
      featureName,
      usageAmount,
      limitAmount,
      workspaceId,
    });

    return { success: true, message: "Usage limit email sent successfully" };
  } catch (error) {
    console.error("Detailed error sending usage limit email:", error);
    return { success: false, error: "Failed to send usage limit email" };
  }
}

export async function sendFounderEmailAction({
  userEmail,
  scheduledAt,
}: {
  userEmail: string;
  scheduledAt?: Date;
}) {
  if (!resend && isDevelopment) {
    const scheduledInfo = scheduledAt
      ? ` (scheduled for ${scheduledAt.toISOString()})`
      : "";
    return sendDevEmail({
      from: "Taqib <taqib@marblecms.com>",
      to: userEmail,
      text: `This is a mock founder email${scheduledInfo}`,
      subject: "A note from Marble's creator",
      _mockContext: { type: "founder", data: { userEmail, scheduledAt } },
    });
  }

  if (!resend) {
    throw new Error("Resend API key not set");
  }

  try {
    await sendFounderEmail(resend, {
      userEmail,
      scheduledAt,
    });

    return { success: true, message: "Founder email sent successfully" };
  } catch (error) {
    console.error("Detailed error sending founder email:", error);
    return { success: false, error: "Failed to send founder email" };
  }
}
