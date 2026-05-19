export function safeRedirectPath(
  value: string | null | undefined,
  fallback = "/"
) {
  if (!value?.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  try {
    const url = new URL(value, "https://marble.local");
    if (url.origin !== "https://marble.local") {
      return fallback;
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
