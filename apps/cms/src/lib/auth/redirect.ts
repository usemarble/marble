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

export function authPageHref(
  path: "/login" | "/register",
  from: string,
  searchParams: Record<string, string | string[] | undefined>
) {
  const query = new URLSearchParams();
  if (from !== "/") {
    query.set("from", from);
  }

  for (const key of ["anonId", "sessionId"]) {
    const param = searchParams[key];
    const value = Array.isArray(param) ? param[0] : param;
    if (value) {
      query.set(key, value);
    }
  }

  const search = query.toString();
  return search ? `${path}?${search}` : path;
}
