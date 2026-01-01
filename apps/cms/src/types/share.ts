// Share page types

export interface ShareAuthor {
  id: string;
  name: string;
  image: string | null;
  bio: string | null;
}

export interface ShareCategory {
  id: string;
  name: string;
  slug: string;
}

export interface ShareTag {
  id: string;
  name: string;
  slug: string;
}

export interface ShareWorkspace {
  id: string;
  name: string;
  logo: string | null;
  slug: string;
}

export interface SharePost {
  id: string;
  title: string;
  content: string;
  contentJson: unknown;
  description: string;
  coverImage: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  attribution: { author: string; url: string } | null;
  authors: ShareAuthor[];
  category: ShareCategory;
  tags: ShareTag[];
  workspace: ShareWorkspace;
}

export interface ShareData {
  post: SharePost;
  expiresAt: string;
}

export interface SharePageClientProps {
  token?: string;
  data?: ShareData;
  status?: "expired" | "not-found";
}

export type ShareStatus = "expired" | "not-found";

// API response types
export interface ShareLinkResponse {
  shareLink: string;
  expiresAt: string;
}

export interface ShareErrorResponse {
  error: string;
}
