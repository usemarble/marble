import { Resend } from "resend";
import { EMAIL_CONFIG } from "./config";
import { sendDevEmail } from "./dev";
import {
  sendFounderEmail,
  sendInviteEmail,
  sendResetPassword,
  sendVerificationEmail,
  sendWelcomeEmail,
} from "./send";

type MockEmail = Parameters<typeof sendDevEmail>[0];

interface AuthMailerOptions {
  resendApiKey: string | undefined;
  /** Without a Resend key, development logs a mock instead of throwing. */
  development: boolean;
}

/**
 * Senders for the emails better-auth triggers (invites, OTPs, password
 * resets, onboarding). They take no session: better-auth has already
 * authorized the request that sends them.
 */
export function createAuthMailer({
  resendApiKey,
  development,
}: AuthMailerOptions) {
  const resend = resendApiKey ? new Resend(resendApiKey) : null;

  async function deliver(
    mock: MockEmail,
    send: (client: Resend) => Promise<unknown>
  ) {
    if (!resend && development) {
      return sendDevEmail(mock);
    }

    if (!resend) {
      throw new Error("Resend API key not set");
    }

    try {
      await send(resend);
      return { success: true, message: "Email sent successfully" };
    } catch (error) {
      console.error("Detailed error sending email:", error);
      return { success: false, error: "Failed to send email" };
    }
  }

  return {
    sendInviteEmail(props: Parameters<typeof sendInviteEmail>[1]) {
      return deliver(
        {
          from: EMAIL_CONFIG.from,
          to: props.inviteeEmail,
          subject: `Join ${props.workspaceName} on Marble`,
          text: "This is a mock invite email",
          _mockContext: { type: "invite", data: { ...props } },
        },
        (client) => sendInviteEmail(client, props)
      );
    },

    sendVerificationEmail(props: Parameters<typeof sendVerificationEmail>[1]) {
      return deliver(
        {
          from: EMAIL_CONFIG.from,
          to: props.userEmail,
          subject: "Verify your email address",
          text: "This is a mock verification email",
          _mockContext: {
            type: "verification",
            data: {
              userEmail: props.userEmail,
              otp: props.otp,
              verificationType: props.type,
            },
          },
        },
        (client) => sendVerificationEmail(client, props)
      );
    },

    sendResetPassword(props: Parameters<typeof sendResetPassword>[1]) {
      return deliver(
        {
          from: EMAIL_CONFIG.from,
          to: props.userEmail,
          subject: "Reset Your Password",
          text: "This is a mock reset password email",
          _mockContext: { type: "reset", data: { ...props } },
        },
        (client) => sendResetPassword(client, props)
      );
    },

    sendWelcomeEmail(props: Parameters<typeof sendWelcomeEmail>[1]) {
      return deliver(
        {
          from: EMAIL_CONFIG.from,
          to: props.userEmail,
          subject: "Welcome to Marble!",
          text: "This is a mock welcome email",
          _mockContext: { type: "welcome", data: { ...props } },
        },
        (client) => sendWelcomeEmail(client, props)
      );
    },

    sendFounderEmail(props: Parameters<typeof sendFounderEmail>[1]) {
      const scheduledInfo = props.scheduledAt
        ? ` (scheduled for ${props.scheduledAt.toISOString()})`
        : "";
      return deliver(
        {
          from: EMAIL_CONFIG.founderFrom,
          to: props.userEmail,
          subject: "Thanks for trying Marble",
          text: `This is a mock founder email${scheduledInfo}`,
          _mockContext: { type: "founder", data: { ...props } },
        },
        (client) => sendFounderEmail(client, props)
      );
    },
  };
}

export type AuthMailer = ReturnType<typeof createAuthMailer>;
