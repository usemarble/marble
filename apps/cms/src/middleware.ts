import { betterFetch } from "@better-fetch/fetch";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { Session } from "./lib/auth/types";
import { getLastActiveWorkspaceOrNewOneToSetAsActive } from "./lib/queries/workspace";

/**
 * Middleware for handling user authentication, email verification, and workspace routing in a Next.js application.
 *
 * Determines the user's session and verification status, then allows, redirects, or blocks access to routes accordingly:
 * - Allows invite and onboarding flows to proceed without interruption.
 * - Redirects unauthenticated users to the login page, preserving the original destination.
 * - Redirects authenticated but unverified users to the email verification page.
 * - Redirects authenticated and verified users away from authentication, root, or verification pages to their last active workspace or onboarding.
 */
export async function middleware(request: NextRequest) {
  const { data: session } = await betterFetch<Session>(
    "/api/auth/get-session",
    {
      baseURL: request.nextUrl.origin,
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    },
  );

  const isVerified = session?.user?.emailVerified;
  const path = request.nextUrl.pathname;
  const isRootPage = path === "/";
  const isInvitePage = path.startsWith("/invite");
  const isOnboardingPage = path.startsWith("/new");
  const isVerifyPage = path.startsWith("/verify");
  const isAuthPage = path.startsWith("/login") || path.startsWith("/register");

  // Allow invite flows to proceed normally
  if (isInvitePage) {
    return NextResponse.next();
  }

  // If not logged in at all
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

  // User is logged in but not verified
  if (session && !isVerified) {
    // Allow only verify page for unverified users
    if (isVerifyPage) {
      return NextResponse.next();
    }

    const callbackUrl = encodeURIComponent(request.nextUrl.pathname);
    // Redirect unverified users to verify page
    return NextResponse.redirect(
      new URL(`/verify?from=${callbackUrl}`, request.url),
    );
  }

  // User is logged in and verified
  if (session && isVerified) {
    // Don't redirect if already on onboarding
    if (isOnboardingPage) {
      return NextResponse.next();
    }

    // Redirect auth pages or root to workspace or onboarding
    if (isAuthPage || isRootPage || isVerifyPage) {
      const workspace = await getLastActiveWorkspaceOrNewOneToSetAsActive(
        session.user.id,
        request.cookies,
      );
      if (workspace) {
        return NextResponse.redirect(
          new URL(`/${workspace.slug}`, request.url),
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
