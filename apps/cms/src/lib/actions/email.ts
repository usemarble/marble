"use server";

import { NextResponse } from "next/server";
import { Resend } from "resend";
import { InviteUserEmail } from "@/components/emails/invite";
import { VerifyUserEmail } from "@/components/emails/verify";
import { WelcomeEmail } from "@/components/emails/welcome";
import { getServerSession } from "../auth/session";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendInviteEmailProps {
  inviteeEmail: string;
  inviteeUsername?: string;
  inviterName: string;
  inviterEmail: string;
  workspaceName: string;
  inviteLink: string;
  teamLogo?: string | null;
}

export async function sendInviteEmailAction({
  inviteeEmail,
  inviterName,
  inviterEmail,
  workspaceName,
  inviteLink,
  teamLogo,
}: SendInviteEmailProps) {
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not set");
    return { error: "Email configuration missing" };
  }
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 401 },
    );
  }

  try {
    const response = await resend.emails.send({
      from: "Marble <emails@marblecms.com>",
      to: inviteeEmail,
      subject: `Join ${workspaceName} on Marble`,
      react: InviteUserEmail({
        inviteeEmail: inviteeEmail,
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
      { status: 200 },
    );
  } catch (error) {
    console.error("Detailed error sending email:", error);
    return NextResponse.json(
      { error: "Failed to send email", details: error },
      { status: 500 },
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
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not set");
    return { error: "Email configuration missing" };
  }

  console.log("called verification email");
  try {
    const response = await resend.emails.send({
      from: "Verification <emails@marblecms.com>",
      to: userEmail,
      subject: "Verify your email address",
      react: VerifyUserEmail({
        userEmail,
        otp,
        type,
      }),
    });

    console.log("Email sent successfully:", response);
    return NextResponse.json(
      { message: "Email sent successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Detailed error sending email:", error);
    return NextResponse.json(
      { error: "Failed to send email", details: error },
      { status: 500 },
    );
  }
}

export async function sendWelcomeEmailAction({
  userEmail,
}: {
  userEmail: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not set");
    return { error: "Email configuration missing" };
  }

  console.log("called welcome email");
  try {
    const response = await resend.emails.send({
      from: "MarbleCMS <emails@marblecms.com>",
      to: userEmail,
      subject: "Welcome to Marble!",
      react: WelcomeEmail({
        userEmail,
      }),
    });

    console.log("Email sent successfully:", response);
    return { message: "Email sent successfully" };
  } catch (error) {
    console.error("Detailed error sending email:", error);
    return { error: "Failed to send email", details: error };
  }
}