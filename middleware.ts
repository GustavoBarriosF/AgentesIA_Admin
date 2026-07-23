import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect superadmin routes (except login)
  if (
    pathname.startsWith("/superadmin") &&
    !pathname.startsWith("/superadmin/login")
  ) {
    // Token stored in localStorage - can't access from middleware (server side)
    // We use a cookie mirror for middleware-level protection
    const saToken = request.cookies.get("sa_token_mirror")?.value;
    if (!saToken) {
      const loginUrl = new URL("/superadmin/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/superadmin/:path*"],
};
