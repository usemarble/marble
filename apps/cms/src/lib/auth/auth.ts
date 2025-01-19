import { sendInviteEmailAction } from "@/lib/actions/email";
import db from "@repo/db";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createAuthMiddleware } from "better-auth/api";
import { organization } from "better-auth/plugins";
import { redirect } from "next/navigation";
import { getActiveOrganization } from "../queries/workspace";

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
    github: {
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
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
        const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${data.organization.id}`;
        sendInviteEmailAction({
          inviteeEmail: data.email,
          inviterName: data.inviter.user.name,
          inviterEmail: data.inviter.user.email,
          workspaceName: data.organization.name,
          teamLogo: data.organization.logo,
          inviteLink,
        });
      },
    }),
  ],
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      const newSession = ctx.context.newSession;
      const isNewUser = newSession?.user && !newSession.user.emailVerified;

      if (isNewUser) {
        redirect("/onboarding");
      }
    }),
  },
  databaseHooks: {
    // To set active organization when a session is created
    // This works but only when user isnt a new user i.e they already have an organization
    session: {
      create: {
        before: async (session) => {
          const organization = await getActiveOrganization(session.userId);
          return {
            data: {
              ...session,
              activeOrganizationId: organization?.id,
            },
          };
        },
      },
    },
  },
});
