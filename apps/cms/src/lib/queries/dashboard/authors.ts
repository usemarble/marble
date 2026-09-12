import "server-only";

import { db } from "@marble/db";
import { author } from "@marble/db/schema";
import { and, asc, eq } from "drizzle-orm";
import type { SocialPlatform } from "@/lib/constants";
import type { Author } from "@/types/author";

export async function getDashboardAuthors(
  workspaceId: string
): Promise<Author[]> {
  const authors = await db.query.author.findMany({
    where: and(eq(author.workspaceId, workspaceId), eq(author.isActive, true)),
    columns: {
      id: true,
      name: true,
      image: true,
      role: true,
      bio: true,
      slug: true,
      email: true,
      userId: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
    with: {
      socials: {
        columns: {
          id: true,
          url: true,
          platform: true,
        },
      },
    },
    orderBy: asc(author.name),
  });

  return authors.map((entry) => ({
    ...entry,
    socials: entry.socials.map((social) => ({
      ...social,
      platform: social.platform as SocialPlatform,
    })),
  }));
}
