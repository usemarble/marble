import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import getServerSession from "./lib/auth/session";
import { getFirstOrganization } from "./utils/organization";

export async function middleware(request: NextRequest) {
  // Get user session
  const session = await getServerSession();

  const path = request.nextUrl.pathname;
  const isAuthPage = path.startsWith("/login") || path.startsWith("/register");
  const isInvitePage = path.startsWith("/invite");
  const isRootPage = path === "/";

  // Allow invite flows to proceed normally
  if (isInvitePage) {
    return NextResponse.next();
  }

  // If logged in and trying to access auth pages or root
  if (session && (isAuthPage || isRootPage)) {
    // Get first workspace or handle no workspace case
    const firstWorkspaceSlug = await getFirstOrganization(session.user.id);
    if (firstWorkspaceSlug) {
      return NextResponse.redirect(
        new URL(`/${firstWorkspaceSlug}`, request.url),
      );
    }
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  // If not logged in and trying to access protected routes
  if (!session && !isAuthPage && !isRootPage) {
    const callbackUrl = encodeURIComponent(request.nextUrl.pathname);
    return NextResponse.redirect(
      new URL(`/login?from=${callbackUrl}`, request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|static|.*\\..*|_next/static|_next/image|favicon.ico).*)"],
};
