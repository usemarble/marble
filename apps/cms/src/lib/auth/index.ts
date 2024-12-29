import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@repo/db";
import { nanoid } from "nanoid";
import NextAuth, { type NextAuthResult } from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { setActiveWorkspace } from "./workspace";

export const result = NextAuth({
  pages: {
    signIn: "/login",
  },
  adapter: PrismaAdapter(prisma),
  providers: [Google, GitHub],
  events: {
    signIn: async (message) => {
      const hasNoWorkspaces = message.isNewUser;
      const fullname = message.user.name;
      const firstname = fullname?.split(" ")[0];
      const defaultWorkspaceSlug = nanoid(16);

      if (hasNoWorkspaces && message.user.id) {
        const firstWorkspace = await prisma.workspace.create({
          data: {
            ownerId: message.user.id,
            name: `${firstname}'s Workspace`,
            description: `${fullname}'s First Workspace!`,
            slug: defaultWorkspaceSlug,
          },
        });
        setActiveWorkspace({
          id: firstWorkspace.id,
          slug: firstWorkspace.slug,
          name: firstWorkspace.name,
        });
      }
    },
  },
});

export const handlers: NextAuthResult["handlers"] = result.handlers;
export const auth: NextAuthResult["auth"] = result.auth;
export const signIn: NextAuthResult["signIn"] = result.signIn;
export const signOut: NextAuthResult["signOut"] = result.signOut;
