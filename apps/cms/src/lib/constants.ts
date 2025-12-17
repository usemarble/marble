export const VALID_DISCORD_DOMAINS = [
  "discord.com",
  "canary.discord.com",
  "ptb.discord.com",
];

export const VALID_SLACK_DOMAINS = ["hooks.slack.com"];

export const timezones = Intl.supportedValuesOf("timeZone");

export const IMAGE_DROPZONE_ACCEPT = [
  ".jpeg",
  ".jpg",
  ".png",
  ".gif",
  ".webp",
  ".avif",
];

export const MEDIA_DROPZONE_ACCEPT = {
  "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp", ".avif", ".svg"],
  "video/*": [
    ".mp4",
    ".mov",
    ".qt",
    ".avi",
    ".wmv",
    ".flv",
    ".mpeg",
    ".mpg",
    ".webm",
    "",
  ],
};

export const ALLOWED_RASTER_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
] as const;

export const ALLOWED_VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
] as const;

export const ALLOWED_MIME_TYPES = [
  ...ALLOWED_RASTER_MIME_TYPES,
  "image/svg+xml",
  ...ALLOWED_VIDEO_MIME_TYPES,
] as const;

export type AllowedRasterMimeType = (typeof ALLOWED_RASTER_MIME_TYPES)[number];
export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export const MAX_AVATAR_FILE_SIZE = 5 * 1024 * 1024;
export const MAX_LOGO_FILE_SIZE = 5 * 1024 * 1024;
export const MAX_MEDIA_FILE_SIZE = 250 * 1024 * 1024;

export const WORKSPACE_SCOPED_PREFIXES = [
  "posts",
  "tags",
  "categories",
  "media",
  "webhooks",
] as const;

export type WorkspaceScopedPrefix = (typeof WORKSPACE_SCOPED_PREFIXES)[number];

export const ALLOWED_AVATAR_HOSTS = [
  "avatars.githubusercontent.com",
  "googleusercontent.com",
] as const;

/**
 * Validates if a URL is from an allowed avatar host with HTTPS protocol
 */
export function isAllowedAvatarUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);

    // Enforce HTTPS protocol
    if (parsedUrl.protocol !== "https:") {
      return false;
    }

    const hostname = parsedUrl.hostname;

    // Check if hostname matches exactly or is a subdomain of allowed hosts
    return ALLOWED_AVATAR_HOSTS.some(
      (allowedHost) =>
        hostname === allowedHost || hostname.endsWith(`.${allowedHost}`)
    );
  } catch {
    // Invalid URL
    return false;
  }
}

export const SOCIAL_PLATFORMS = {
  x: "x",
  github: "github",
  facebook: "facebook",
  instagram: "instagram",
  youtube: "youtube",
  tiktok: "tiktok",
  linkedin: "linkedin",
  website: "website",
  onlyfans: "onlyfans",
  discord: "discord",
  bluesky: "bluesky",
} as const;

export type SocialPlatform = keyof typeof SOCIAL_PLATFORMS;

export const PLATFORM_DOMAINS = {
  x: ["twitter.com", "x.com"],
  github: ["github.com"],
  facebook: ["facebook.com", "fb.com"],
  instagram: ["instagram.com"],
  youtube: ["youtube.com", "youtu.be"],
  tiktok: ["tiktok.com"],
  linkedin: ["linkedin.com"],
  onlyfans: ["onlyfans.com"],
  discord: ["discord.com"],
  bluesky: ["bsky.app"],
} as const;

export const MEDIA_SORT_BY = ["createdAt", "name"] as const;
export const SORT_DIRECTIONS = ["asc", "desc"] as const;

export const MEDIA_SORTS = MEDIA_SORT_BY.flatMap((field) =>
  SORT_DIRECTIONS.map((direction) => `${field}_${direction}` as const)
);

export const MEDIA_TYPES = ["image", "video", "audio", "document"] as const;

export const MEDIA_FILTER_TYPES = ["all", ...MEDIA_TYPES] as const;

export const MEDIA_LIMIT = 20;

/**
 * Reserved workspace slugs that cannot be used for workspace creation
 * to prevent conflicts with system routes and Next.js internals
 */
export const RESERVED_WORKSPACE_SLUGS = [
  // Auth routes
  "login",
  "register",
  "reset",
  "verify",
  "join",
  "invite",
  "auth",
  // System routes
  "api",
  "new",
  "share",
  "settings",
  // API routes
  "account",
  "accounts",
  "ai",
  "billing",
  "complete",
  "import",
  "metrics",
  "polar",
  "preferences",
  "publishing",
  "suggestions",
  "upload",
  "usage",
  "user",
  "workspace",
  "workspaces",
  "success",
  // Workspace-level pages (dashboard routes)
  "posts",
  "post",
  "categories",
  "category",
  "tags",
  "tag",
  "authors",
  "author",
  "media",
  "webhooks",
  "webhook",
  "hooks",
  "hook",
  "keys",
  "key",
  "editor",
  // Next.js internals
  "_next",
  "static",
  "favicon",
  "robots",
  "sitemap",
  // Future-proofing common patterns
  "admin",
  "dashboard",
  "app",
  "www",
  "blog",
  "docs",
  "help",
  "support",
  "about",
  "contact",
  "pricing",
  "terms",
  "privacy",
] as const;
