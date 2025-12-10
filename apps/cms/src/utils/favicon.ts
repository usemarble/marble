export function getFaviconUrl(url: string): string {
  const domain = new URL(url).hostname;
  return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
}

export function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}