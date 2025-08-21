export type PricingPlan = {
  title: string;
  description: string;
  price: {
    monthly: string;
    yearly: string;
  };
  features: string[];
  button: {
    href: string;
    label: string;
  };
};

export const PRICING_PLANS: PricingPlan[] = [
  {
    title: "Pro",
    description: "For Small Teams",
    price: {
      monthly: "$10",
      yearly: "$100",
    },
    features: [
      "Unlimited posts",
      "2 GB media storage",
      "Up to 10 team members",
      "Unlimited API requests per month",
      "Image optimization",
      "Readability insights",
      "Keyword optimization suggestions",
    ],
    button: {
      href: "https://app.marblecms.com",
      label: "Get Started",
    },
  },
];

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
