import { format } from "date-fns";

/**
 * Formats a UTC-midnight date as a calendar date string, ignoring the
 * browser's local timezone so "March 18 00:00 UTC" always renders as
 * "Mar 18, 2026" regardless of where the viewer is.
 */
export function formatCalendarDate(date: Date, formatStr: string) {
  const local = new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  );
  return format(local, formatStr);
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
