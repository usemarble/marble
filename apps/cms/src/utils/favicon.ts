export function getFaviconUrl(url: string): string {
  const domain = new URL(url).hostname;
  return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
}
