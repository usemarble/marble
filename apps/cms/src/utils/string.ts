export function generateSlug(text: string) {
  const slug = text
    .normalize("NFD") // Normalize Unicode to decomposed form (e.g., é → e + combining accent)
    .replace(/[\u0300-\u036f]/g, "") // Remove combining diacritical marks
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-") // Replace whitespace variants and underscores with hyphens
    .replace(/[^a-z0-9-]/g, "") // Allow only lowercase letters, digits, and hyphens
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
