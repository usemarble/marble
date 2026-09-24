import { NextResponse } from "next/server";

const IDS = {
  marketingAnonymousId: "marble_marketing_id",
  marketingSessionId: "marble_marketing_session",
  appAnonymousId: "marble_app_id",
  appSessionId: "marble_app_session",
} as const;

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "production") {
    return new Response(null, { status: 204 });
  }

  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return new Response(null, { status: 400 });
  }

  const values = body as Record<string, unknown>;
  const response = new NextResponse(null, { status: 204 });
  for (const [field, name] of Object.entries(IDS)) {
    const value = values[field];
    if (typeof value !== "string" || !/^[a-zA-Z0-9_-]{8,128}$/.test(value)) {
      continue;
    }
    response.cookies.set(name, value, {
      httpOnly: true,
      secure: new URL(request.url).protocol === "https:",
      sameSite: "lax",
      path: "/api/auth",
      maxAge: 60 * 60 * 24 * 7,
    });
  }
  return response;
}
