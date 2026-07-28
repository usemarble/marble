export const prerender = false;

const CATALOG_URL = "https://marblecms.com/.well-known/api-catalog";
const PROFILE_URL = "https://www.rfc-editor.org/info/rfc9727";
const CACHE_CONTROL =
  "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800";

const catalog = {
  linkset: [
    {
      anchor: "https://api.marblecms.com/v1",
      "service-desc": [
        {
          href: "https://marblecms.com/openapi.json",
          type: "application/json",
        },
      ],
      "service-doc": [
        {
          href: "https://docs.marblecms.com/api/introduction",
          type: "text/html",
        },
      ],
    },
    {
      anchor: "https://mcp.marblecms.com/mcp",
      "service-desc": [
        {
          href: "https://marblecms.com/.well-known/mcp/server-card.json",
          type: "application/json",
        },
      ],
      "service-doc": [
        {
          href: "https://docs.marblecms.com/tools/mcp",
          type: "text/html",
        },
      ],
    },
  ],
};

const headers = {
  "Cache-Control": CACHE_CONTROL,
  "Content-Type": `application/linkset+json; profile="${PROFILE_URL}"`,
  Link: `<${CATALOG_URL}>; rel="api-catalog"; type="application/linkset+json"`,
};

export function GET() {
  return new Response(JSON.stringify(catalog), { headers });
}

export function HEAD() {
  return new Response(null, { headers });
}
