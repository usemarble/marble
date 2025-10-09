// Share page types

export type ShareAuthor = {
  id: string;
  name: string;
  image: string | null;
  bio: string | null;
};

export type ShareCategory = {
  id: string;
  name: string;
  slug: string;
};

export type ShareTag = {
  id: string;
  name: string;
  slug: string;
};

export type ShareWorkspace = {
  id: string;
  name: string;
  logo: string | null;
  slug: string;
};

export type SharePost = {
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
};

export type ShareData = {
  post: SharePost;
  expiresAt: string;
};

export type SharePageClientProps = {
  token?: string;
  data?: ShareData;
  status?: "expired" | "not-found";
};

export type ShareStatus = "expired" | "not-found";

// API response types
export type ShareLinkResponse = {
  shareLink: string;
  expiresAt: string;
};

export type ShareErrorResponse = {
  error: string;
};
