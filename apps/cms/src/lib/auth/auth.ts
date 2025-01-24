import { sendInviteEmailAction } from "@/lib/actions/email";
import db from "@repo/db";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";
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
        const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${data.id}`;
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
      console.log("ctx", ctx.path);
      if (ctx.path.startsWith("/sign-up")) {
        const newSession = ctx.context.newSession;
        const user = newSession?.user;
        if (user) {
          const isNewSignup =
            new Date().getTime() - user.createdAt.getTime() < 30000;
          if (isNewSignup) {
            throw ctx.redirect("/new");
          }
        }
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
