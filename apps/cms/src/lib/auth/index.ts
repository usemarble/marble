import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@repo/db";
import { nanoid } from "nanoid";
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

export const { handlers, signIn, signOut, auth } = NextAuth({
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
      const defaultWorkspaceSlug = `${firstname?.toLowerCase()}-${nanoid(6)}`;

      if (hasNoWorkspaces && message.user.id) {
        await prisma.workspace.create({
          data: {
            ownerId: message.user.id,
            name: `${firstname}'s Workspace`,
            description: `${fullname}'s First Workspace!`,
            slug: defaultWorkspaceSlug,
          },
        });
      }
    },
  },
});
