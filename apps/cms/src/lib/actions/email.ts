"use server";

import { InviteUserEmail } from "@/components/emails/invite";
import { NextResponse } from "next/server";
import { Resend } from "resend";

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
  inviteeUsername,
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

  try {
    const response = await resend.emails.send({
      from: "Marble <invites@hello.taqib.dev>",
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
