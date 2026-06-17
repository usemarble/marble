export const API_KEY_PREFIXES = {
  public: "mpk",
  private: "msk",
} as const;

export const API_KEY_READ_SCOPES = [
  "posts_read",
  "authors_read",
  "categories_read",
  "tags_read",
  "media_read",
  "fields_read",
] as const;

export const API_KEY_DRAFT_READ_SCOPES = ["posts_read_drafts"] as const;

export const API_KEY_WRITE_SCOPES = [
  "posts_write",
  "authors_write",
  "categories_write",
  "tags_write",
  "media_write",
  "fields_write",
] as const;

export const API_KEY_PRIVATE_ONLY_SCOPES = [
  ...API_KEY_DRAFT_READ_SCOPES,
  ...API_KEY_WRITE_SCOPES,
] as const;

export const API_KEY_SCOPES = [
  ...API_KEY_READ_SCOPES,
  ...API_KEY_PRIVATE_ONLY_SCOPES,
] as const;

export type ApiScope = (typeof API_KEY_SCOPES)[number];

export const DEFAULT_PUBLIC_API_KEY_SCOPES = API_KEY_READ_SCOPES;
export const DEFAULT_PRIVATE_API_KEY_SCOPES = API_KEY_SCOPES;

export const API_KEY_SCOPE_BY_RESOURCE = {
  posts: {
    read: "posts_read",
    readDrafts: "posts_read_drafts",
    write: "posts_write",
  },
  authors: {
    read: "authors_read",
    write: "authors_write",
  },
  categories: {
    read: "categories_read",
    write: "categories_write",
  },
  tags: {
    read: "tags_read",
    write: "tags_write",
  },
  media: {
    read: "media_read",
    write: "media_write",
  },
  fields: {
    read: "fields_read",
    write: "fields_write",
  },
} as const satisfies Record<
  string,
  { read: ApiScope; readDrafts?: ApiScope; write: ApiScope }
>;
