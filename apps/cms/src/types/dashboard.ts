import type { RouterOutputs } from "@marble/api/routers";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  postsCount: number;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  postsCount: number;
}

export interface Post {
  id: string;
  title: string;
  coverImage: string | null;
  status: "published" | "draft";
  featured: boolean;
  publishedAt: Date;
  updatedAt: Date;
  category: {
    id: string;
    name: string;
  };
  authors: Array<{
    id: string;
    name: string;
    image: string | null;
  }>;
}

export type APIKey = RouterOutputs["keys"]["list"][number];

export type UsageDashboardData =
  RouterOutputs["workspaces"]["metrics"]["usage"];
