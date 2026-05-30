import "server-only";

import { db } from "@marble/db";
import type { SocialPlatform } from "@/lib/constants";
import type { Author } from "@/types/author";

export async function getDashboardAuthors(
  workspaceId: string
): Promise<Author[]> {
  const authors = await db.author.findMany({
    where: {
      workspaceId,
      isActive: true,
    },
    select: {
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
      socials: {
        select: {
          id: true,
          url: true,
          platform: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return authors.map((author) => ({
    ...author,
    socials: author.socials.map((social) => ({
      ...social,
      platform: social.platform as SocialPlatform,
    })),
  }));
}
