import db from "@repo/db";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createAuthMiddleware } from "better-auth/api";
import { customSession, organization } from "better-auth/plugins";
import { redirect } from "next/navigation";
import { sendInviteEmail } from "../../utils/email";
import { authClient } from "./client";

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
    github: {
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
    },
  },
  advanced: {
    generateId: false,
  },
  organization: {
    modelName: "workspace",
  },
  plugins: [
    organization({
      async sendInvitationEmail(data) {
        const inviteLink = `https://example.com/accept-invitation/${data.id}`;
        sendInviteEmail({
          inviteeEmail: data.email,
          inviterName: data.inviter.user.name,
          inviterEmail: data.inviter.user.email,
          workspaceName: data.organization.name,
          inviteLink,
        });
      },
    }),
    customSession(async ({ user, session }) => {
      // const { data: activeOrganization } = authClient.useActiveOrganization();
      return {
        user: {
          name: user.name,
          id: user.id,
          image: user.image,
          email: user.email,
        },
        session: {
          id: session.id,
          token: session.token,
          // organizationId: activeOrganization.id as string,
          // organizationSlug: activeOrganization.slug as string,
        },
      };
    }),
  ],
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      const newSession = ctx.context.newSession;
      if (newSession) {
        redirect("/onboarding");
      }
    }),
  },
});
