export const prerender = false;

const CACHE_CONTROL =
  "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800";

const SOURCE = "https://marblecms.com/.well-known/integrations.json";

const manifest = {
  domain: "marblecms.com",
  version: 3,
  summary:
    "Marble exposes a REST API at api.marblecms.com/v1 and a remote MCP server at mcp.marblecms.com/mcp; both are authenticated with a scoped Marble API key.",
  credentials: {
    marble_api_key: {
      type: "api_key",
      label:
        "Marble API key (public mpk_... or private msk_... scoped workspace key)",
      generateUrl: "https://app.marblecms.com",
      setup:
        "In your Marble workspace dashboard, open Settings -> API Keys, click Create API Key, choose a name, select either a public read-only key (mpk_...) or a private key (msk_...), grant the needed scopes, then copy the key because it is only shown once. The API docs cover Authorization header usage and available scopes.",
    },
  },
  surfaces: [
    {
      slug: "marble-rest-api",
      name: "Marble REST API",
      type: "openapi",
      spec: "https://api.marblecms.com/openapi.json",
      docs: "https://docs.marblecms.com/api/introduction",
      basis: {
        via: "declared",
        source: SOURCE,
      },
      auth: {
        status: "required",
        entries: [
          {
            use: [
              {
                id: "marble_api_key",
                mechanics: {
                  source: "spec",
                  scheme: "apiKey",
                },
              },
            ],
            basis: {
              via: "declared",
              source: SOURCE,
            },
          },
        ],
      },
    },
    {
      slug: "marble-mcp-server",
      name: "Marble MCP Server",
      type: "mcp",
      url: "https://mcp.marblecms.com/mcp",
      transports: ["streamable-http"],
      docs: "https://docs.marblecms.com/tools/mcp",
      basis: {
        via: "declared",
        source: SOURCE,
      },
      auth: {
        status: "required",
        entries: [
          {
            use: [
              {
                id: "marble_api_key",
                mechanics: {
                  source: "inline",
                  in: "header",
                  headerName: "Mcp-Marble-Api-Key",
                },
              },
            ],
            basis: {
              via: "declared",
              source: SOURCE,
            },
          },
          {
            use: [
              {
                id: "marble_api_key",
                mechanics: {
                  source: "inline",
                  in: "header",
                  headerName: "Authorization",
                  scheme: "Bearer",
                },
              },
            ],
            basis: {
              via: "declared",
              source: SOURCE,
            },
          },
        ],
      },
    },
  ],
};

export function GET() {
  return Response.json(manifest, {
    headers: {
      "Cache-Control": CACHE_CONTROL,
    },
  });
}
