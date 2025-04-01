import axios from "axios";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Session } from "./lib/auth/types";
import { getUserWorkspace } from "./lib/queries/workspace";

export async function middleware(request: NextRequest) {
  const { data: session } = await axios
    .get<Session>(`${request.nextUrl.origin}/api/auth/get-session`, {
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    })
    .catch(() => ({ data: null }));

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
      const workspaceSlug = await getUserWorkspace(
        session.user.id,
        request.cookies,
      );
      if (workspaceSlug) {
        return NextResponse.redirect(new URL(`/${workspaceSlug}`, request.url));
      }
      return NextResponse.redirect(new URL("/new", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|static|.*\\..*|_next/static|_next/image|favicon.ico).*)"],
};
