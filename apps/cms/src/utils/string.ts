export function generateSlug(text: string) {
  const slug = text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "") // Allow lowercase letters, digits, and hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens

  return slug;
}

export function formatBytes(
  bytes: number,
  opts: {
    decimals?: number;
    sizeType?: "accurate" | "normal";
  } = {}
) {
  const { decimals = 2, sizeType = "normal" } = opts;

  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const accurateSizes = ["Bytes", "KiB", "MiB", "GiB", "TiB"];

  if (bytes === 0) {
    return "0 Byte";
  }

  const i = Math.floor(Math.log(bytes) / Math.log(1024));

  return `${Number.parseFloat((bytes / 1024 ** i).toFixed(decimals))} ${
    sizeType === "accurate" ? accurateSizes[i] : sizes[i]
  }`;
}

import { nanoid } from "nanoid";

type ApiKeyType = "public" | "private";

/**
 * Generates an API key with prefix and preview
 * @param type - The type of API key (public or private)
 * @returns Object containing the full key, prefix, and preview
 */
export function generateApiKey(type: ApiKeyType = "private") {
  const prefix = type === "public" ? "mbl_pk_" : "mbl_sk_";
  const randomSuffix = nanoid(32);
  const fullKey = `${prefix}${randomSuffix}`;
  const preview = `${prefix}${randomSuffix.slice(0, 8)}...`;

  return {
    key: fullKey,
    prefix,
    preview,
  };
}
