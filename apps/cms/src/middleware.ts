import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Session } from "./lib/auth/types";
import { getFirstOrganization } from "./utils/organization";

export async function middleware(request: NextRequest) {
  const sessionRes = await fetch(
    `${request.nextUrl.origin}/api/auth/get-session`,
    {
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    },
  );

  const session: Session = sessionRes.ok ? await sessionRes.json() : null;

  const path = request.nextUrl.pathname;
  const isRootPage = path === "/";
  const isInvitePage = path.startsWith("/invite");
  const isOnboardingPage = path.startsWith("/new");
  const isAuthPage = path.startsWith("/login") || path.startsWith("/register");

  // Allow invite flows to proceed normally
  if (isInvitePage) {
    return NextResponse.next();
  }

  // If not logged in
  if (!session) {
    // Allow auth pages
    if (isAuthPage) {
      return NextResponse.next();
    }

    // Redirect to login for protected routes
    const callbackUrl = encodeURIComponent(request.nextUrl.pathname);
    return NextResponse.redirect(
      new URL(`/login?from=${callbackUrl}`, request.url),
    );
  }

  // User is logged in
  if (session) {
    // Don't redirect if already on onboarding
    if (isOnboardingPage) {
      return NextResponse.next();
    }

    // Redirect auth pages or root to workspace or onboarding
    if (isAuthPage || isRootPage) {
      const firstWorkspaceSlug = await getFirstOrganization(session.user.id);
      if (firstWorkspaceSlug) {
        return NextResponse.redirect(
          new URL(`/${firstWorkspaceSlug}`, request.url),
        );
      }
      return NextResponse.redirect(new URL("/new", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|static|.*\\..*|_next/static|_next/image|favicon.ico).*)"],
};
