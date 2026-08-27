type SharedAuthor = {
  id: string;
  name: string;
  image: string | null;
  bio: string | null;
};

type SharedTag = {
  id: string;
  name: string;
  slug: string;
};

type SharedPostRow = {
  id: string;
  title: string;
  content: string;
  contentJson: unknown;
  description: string;
  coverImage: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date;
  authors: Array<{ author: SharedAuthor }>;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  tags: Array<{ tag: SharedTag }>;
  workspace: {
    id: string;
    name: string;
    logo: string | null;
    slug: string;
  };
};

export function formatSharedPostPayload(postRow: SharedPostRow) {
  return {
    id: postRow.id,
    title: postRow.title,
    content: postRow.content,
    contentJson: postRow.contentJson,
    description: postRow.description,
    coverImage: postRow.coverImage,
    status: postRow.status,
    createdAt: postRow.createdAt,
    updatedAt: postRow.updatedAt,
    publishedAt: postRow.publishedAt,
    authors: postRow.authors.map((entry) => entry.author),
    category: postRow.category,
    tags: postRow.tags.map((entry) => entry.tag),
    workspace: postRow.workspace,
  };
}
