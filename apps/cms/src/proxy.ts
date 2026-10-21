import { type NextRequest, NextResponse } from "next/server";

export const config = { matcher: "/billing/success" };

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  if (
    pathname !== "/billing/success" ||
    !(
      searchParams.has("checkout_id") ||
      searchParams.has("customer_session_token")
    )
  ) {
    return NextResponse.next();
  }

  const cleanUrl = request.nextUrl.clone();
  cleanUrl.searchParams.delete("checkout_id");
  cleanUrl.searchParams.delete("customer_session_token");

  const response = NextResponse.redirect(cleanUrl, 307);
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("Cache-Control", "no-store");
  return response;
}
