import type { Dateish, EventPayload } from "../types";

/** Serializes optional dates into the string/null shape used in webhook payloads. */
function serializeDate(value: Dateish) {
  if (!value) {
    return null;
  }
  return value instanceof Date ? value.toISOString() : value;
}

export interface AuthorInput {
  id: string;
  name: string;
  slug: string;
  bio?: string | null;
  role?: string | null;
  image?: string | null;
  email?: string | null;
  socials?: Array<{ platform: string; url: string }> | null;
  createdAt?: Dateish;
  updatedAt?: Dateish;
}

/** Converts an author record into Marble's public author webhook payload. */
export function toAuthorPayload(author: AuthorInput): EventPayload {
  return {
    id: author.id,
    name: author.name,
    slug: author.slug,
    bio: author.bio ?? null,
    role: author.role ?? null,
    image: author.image ?? null,
    email: author.email ?? null,
    socials:
      author.socials?.map((social) => ({
        platform: social.platform,
        url: social.url,
      })) ?? [],
    createdAt: serializeDate(author.createdAt),
    updatedAt: serializeDate(author.updatedAt),
  };
}

export interface CategoryInput {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  createdAt?: Dateish;
  updatedAt?: Dateish;
}

/** Converts a category record into Marble's public category webhook payload. */
export function toCategoryPayload(category: CategoryInput): EventPayload {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description ?? null,
    createdAt: serializeDate(category.createdAt),
    updatedAt: serializeDate(category.updatedAt),
  };
}

export interface TagInput {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  createdAt?: Dateish;
  updatedAt?: Dateish;
}

/** Converts a tag record into Marble's public tag webhook payload. */
export function toTagPayload(tag: TagInput): EventPayload {
  return {
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    description: tag.description ?? null,
    createdAt: serializeDate(tag.createdAt),
    updatedAt: serializeDate(tag.updatedAt),
  };
}

export interface MediaInput {
  id: string;
  name: string;
  url?: string | null;
  alt?: string | null;
  type: string;
  size: number;
  mimeType?: string | null;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
  blurHash?: string | null;
  createdAt?: Dateish;
  updatedAt?: Dateish;
}

/** Converts a media record into Marble's public media webhook payload. */
export function toMediaPayload(media: MediaInput): EventPayload {
  return {
    id: media.id,
    name: media.name,
    url: media.url ?? null,
    alt: media.alt ?? null,
    type: media.type,
    size: media.size,
    mimeType: media.mimeType ?? null,
    width: media.width ?? null,
    height: media.height ?? null,
    duration: media.duration ?? null,
    blurHash: media.blurHash ?? null,
    createdAt: serializeDate(media.createdAt),
    updatedAt: serializeDate(media.updatedAt),
  };
}

export interface PostInput {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  coverImage?: string | null;
  status?: string | null;
  featured?: boolean | null;
  categoryId?: string | null;
  primaryAuthorId?: string | null;
  publishedAt?: Dateish;
  createdAt?: Dateish;
  updatedAt?: Dateish;
}

/** Converts a post record into Marble's public post webhook payload. */
export function toPostPayload(post: PostInput): EventPayload {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    description: post.description ?? null,
    coverImage: post.coverImage ?? null,
    status: post.status ?? null,
    featured: post.featured ?? null,
    categoryId: post.categoryId ?? null,
    primaryAuthorId: post.primaryAuthorId ?? null,
    publishedAt: serializeDate(post.publishedAt),
    createdAt: serializeDate(post.createdAt),
    updatedAt: serializeDate(post.updatedAt),
  };
}

/** Attaches changed field names to an update event payload. */
export function withChanges(
  payload: EventPayload,
  changes: string[]
): EventPayload {
  return {
    ...payload,
    changes,
  };
}
