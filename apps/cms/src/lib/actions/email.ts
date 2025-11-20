"use server";

import { NextResponse } from "next/server";
import { Resend } from "resend";
import { InviteUserEmail } from "@/components/emails/invite";
import { ResetPasswordEmail } from "@/components/emails/reset";
import { VerifyUserEmail } from "@/components/emails/verify";
import { WelcomeEmail } from "@/components/emails/welcome";
import { sendDevEmail } from "@/lib/email";
import { getServerSession } from "../auth/session";

const resendApiKey = process.env.RESEND_API_KEY;
const isDevelopment = process.env.NODE_ENV === "development";
const resend = resendApiKey ? new Resend(resendApiKey) : null;

type SendInviteEmailProps = {
  inviteeEmail: string;
  inviteeUsername?: string;
  inviterName: string;
  inviterEmail: string;
  workspaceName: string;
  inviteLink: string;
  teamLogo?: string | null;
};

export async function sendInviteEmailAction({
  inviteeEmail,
  inviterName,
  inviterEmail,
  workspaceName,
  inviteLink,
  teamLogo,
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
          teamLogo: teamLogo || "default",
        },
      },
    });
  }

  const session = await getServerSession();

  if (!session) {
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 401 }
    );
  }

  if (!resend) {
    throw new Error("Resend API key not set");
  }

  try {
    const response = await resend.emails.send({
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

    console.log("Email sent successfully:", response);
    return NextResponse.json(
      { message: "Email sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Detailed error sending email:", error);
    return NextResponse.json(
      { error: "Failed to send email", details: error },
      { status: 500 }
    );
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
  console.log("called verification email");

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
    await resend.emails.send({
      from: "Marble <emails@marblecms.com>",
      to: userEmail,
      subject: "Verify your email address",
      react: VerifyUserEmail({
        userEmail,
        otp,
        type,
      }),
    });

    return NextResponse.json(
      { message: "Email sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Detailed error sending email:", error);
    return NextResponse.json(
      { error: "Failed to send email", details: error },
      { status: 500 }
    );
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
    const response = await resend.emails.send({
      from: "Marble <emails@marblecms.com>",
      to: userEmail,
      subject: "Reset Your Password",
      react: ResetPasswordEmail({
        userEmail,
        resetLink,
      }),
    });

    console.log("Email sent successfully:", response);
    return NextResponse.json(
      { message: "Email sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Detailed error sending email:", error);
    return NextResponse.json(
      { error: "Failed to send email", details: error },
      { status: 500 }
    );
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
    await resend.emails.send({
      from: "Marble <emails@marblecms.com>",
      to: userEmail,
      subject: "Welcome to Marble!",
      react: WelcomeEmail({
        userEmail,
      }),
    });

    return { message: "Email sent successfully" };
  } catch (error) {
    console.error("Detailed error sending email:", error);
    return { error: "Failed to send email", details: error };
  }
}
