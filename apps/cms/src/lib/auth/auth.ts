import db from "@repo/db";
import { betterAuth } from "better-auth";
import { redirect } from "next/navigation";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";
import { createAuthMiddleware } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { getActiveOrganization } from "../queries/workspace";
import { sendInviteEmailAction } from "@/lib/actions/email";

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
    nextCookies(),
  ],
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      const newSession = ctx.context.newSession;
      const user = newSession?.user;
      if (!user) return;
      
      const isNewSignup = new Date().getTime() - user.createdAt.getTime() < 30000;

      if (isNewSignup) {
        redirect("/new");
      }
    }),
  },
  databaseHooks: {
    // To set active organization when a session is created
    // This works but only when user isnt a new user i.e they already have an organization
    session: {
      create: {
        before: async (session) => {
          try {
            const organization = await getActiveOrganization(session.userId);
            return {
              data: {
                ...session,
                activeOrganizationId: organization?.id || null,
              },
            };
          } catch (error) {
            // If there's an error, create the session without an active org
            return { data: session };
          }
        },
      },
    },
  },
});
