export const prerender = false;

const OPENAPI_URL = "https://api.marblecms.com/openapi.json";
const CACHE_CONTROL =
  "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800";

export async function GET() {
  const response = await fetch(OPENAPI_URL, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    return Response.json(
      { error: "Failed to fetch Marble OpenAPI document" },
      {
        status: 502,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }

  return new Response(await response.text(), {
    headers: {
      "Cache-Control": CACHE_CONTROL,
      "Content-Type":
        response.headers.get("Content-Type") ??
        "application/json; charset=utf-8",
    },
  });
}
