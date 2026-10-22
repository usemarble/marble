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

export type Post = RouterOutputs["posts"]["list"]["posts"][number];

export type APIKey = RouterOutputs["keys"]["list"][number];

export type UsageDashboardData =
  RouterOutputs["workspaces"]["metrics"]["usage"];
