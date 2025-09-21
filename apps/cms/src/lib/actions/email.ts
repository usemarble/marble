"use server";

import { NextResponse } from "next/server";
import { type CreateEmailOptions, Resend } from "resend";
import { InviteUserEmail } from "@/components/emails/invite";
import { ResetPasswordEmail } from "@/components/emails/reset";
import { VerifyUserEmail } from "@/components/emails/verify";
import { WelcomeEmail } from "@/components/emails/welcome";
import { getServerSession } from "../auth/session";

const resendApiKey = process.env.RESEND_API_KEY;
const isDevelopment = process.env.NODE_ENV === "development";

type MockableEmailOptions = CreateEmailOptions & {
  _mockContext?: {
    type: "invite" | "verification" | "reset" | "welcome";
    data: Record<string, any>;
  };
};

const mockResend = {
  emails: {
    send: async (options: MockableEmailOptions) => {
      console.log("--- MOCK EMAIL SENT (DEVELOPMENT MODE) ---");
      console.log("From:", options.from);
      console.log("To:", options.to);
      console.log("Subject:", options.subject);

      if (options._mockContext) {
        const { type, data } = options._mockContext;
        console.log("Email Type:", type.toUpperCase());
        console.log("Email Data:");
        Object.entries(data).forEach(([key, value]) => {
          console.log(`  ${key}:`, value);
        });
      } else {
        console.log("React Component: Email component");
      }

      console.log("----------------------------------------------");
      return { data: { id: "mock-email-id" }, error: null };
    },
  },
};

const resend = resendApiKey ? new Resend(resendApiKey) : mockResend;

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
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 401 }
    );
  }

  try {
    const emailOptions: MockableEmailOptions = {
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
    };

    if (isDevelopment && !resendApiKey) {
      emailOptions._mockContext = {
        type: "invite",
        data: {
          inviteeEmail,
          inviterName,
          inviterEmail,
          workspaceName,
          inviteLink,
          teamLogo: teamLogo || "default",
        },
      };
    }

    const response = await resend.emails.send(emailOptions);

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
  try {
    const emailOptions: MockableEmailOptions = {
      from: "Verification <emails@marblecms.com>",
      to: userEmail,
      subject: "Verify your email address",
      react: VerifyUserEmail({
        userEmail,
        otp,
        type,
      }),
    };

    if (isDevelopment && !resendApiKey) {
      emailOptions._mockContext = {
        type: "verification",
        data: {
          userEmail,
          otp,
          verificationType: type,
        },
      };
    }

    const response = await resend.emails.send(emailOptions);

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
  try {
    const emailOptions: MockableEmailOptions = {
      from: "MarbleCMS <emails@marblecms.com>",
      to: userEmail,
      subject: "Reset Your Password",
      react: ResetPasswordEmail({
        userEmail,
        resetLink,
      }),
    };

    if (isDevelopment && !resendApiKey) {
      emailOptions._mockContext = {
        type: "reset",
        data: {
          userEmail,
          resetLink,
        },
      };
    }

    const response = await resend.emails.send(emailOptions);

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
  try {
    const emailOptions: MockableEmailOptions = {
      from: "MarbleCMS <emails@marblecms.com>",
      to: userEmail,
      subject: "Welcome to Marble!",
      react: WelcomeEmail({
        userEmail,
      }),
    };

    if (isDevelopment && !resendApiKey) {
      emailOptions._mockContext = {
        type: "welcome",
        data: {
          userEmail,
        },
      };
    }

    await resend.emails.send(emailOptions);

    return { message: "Email sent successfully" };
  } catch (error) {
    console.error("Detailed error sending email:", error);
    return { error: "Failed to send email", details: error };
  }
}
