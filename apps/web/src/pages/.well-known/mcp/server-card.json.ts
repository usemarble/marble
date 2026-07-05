export const prerender = false;

const CACHE_CONTROL =
  "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800";

const serverCard = {
  url: "https://mcp.marblecms.com/mcp",
  authentication: {
    type: "api_key",
    headers: ["Mcp-Marble-Api-Key", "X-Marble-Api-Key", "Authorization"],
  },
};

export function GET() {
  return Response.json(serverCard, {
    headers: {
      "Cache-Control": CACHE_CONTROL,
    },
  });
}
