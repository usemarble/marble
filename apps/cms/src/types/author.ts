import type { SocialPlatform } from "@/lib/constants";

export interface AuthorSocial {
  id: string;
  url: string;
  platform: SocialPlatform;
}

export interface Author {
  id: string;
  name: string;
  image: string | null;
  role: string | null;
  bio: string | null;
  email: string | null;
  slug: string;
  userId: string | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  socials?: AuthorSocial[];
}
