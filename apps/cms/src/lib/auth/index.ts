import db from "@repo/db";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createAuthMiddleware } from "better-auth/api";
import { organization } from "better-auth/plugins";
import { authClient } from "./client";

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
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
  plugins: [organization()],
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      const newSession = ctx.context.newSession;
      if (newSession) {
        // await authClient.organization.create({
        //   name: newSession.user.email,
        //   email: newSession.user.email,
        //   logo: `https://avatar.vercel.sh/${newSession?.user.name}.svg?text=${newSession?.user.name.split(" ")[0]?.slice(0, 1)}W`,
        // });
      }
    }),
  },
});
