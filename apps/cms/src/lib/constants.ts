export const VALID_DISCORD_DOMAINS = [
  "discord.com",
  "canary.discord.com",
  "ptb.discord.com",
];

export const VALID_SLACK_DOMAINS = ["hooks.slack.com"];

export const IMAGE_DROPZONE_ACCEPT = [
  ".jpeg",
  ".jpg",
  ".png",
  ".gif",
  ".webp",
  ".avif",
];

export const MEDIA_DROPZONE_ACCEPT = {
  "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp", ".avif"],
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
  ...ALLOWED_VIDEO_MIME_TYPES,
] as const;

export type AllowedRasterMimeType = (typeof ALLOWED_RASTER_MIME_TYPES)[number];
export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export const MAX_AVATAR_FILE_SIZE = 5 * 1024 * 1024;
export const MAX_LOGO_FILE_SIZE = 5 * 1024 * 1024;
export const MAX_MEDIA_FILE_SIZE = 250 * 1024 * 1024;

export const WORKSPACE_SCOPED_PREFIXES = [
  "ai-readability-suggestions",
  "authors",
  "billing-usage",
  "categories",
  "posts",
  "publishing-metrics",
  "tags",
  "team",
  "usage-dashboard",
  "media",
  "webhooks",
  "keys",
  "custom-fields",
] as const;

export type WorkspaceScopedPrefix = (typeof WORKSPACE_SCOPED_PREFIXES)[number];

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
export const POST_LIMIT = 20;
