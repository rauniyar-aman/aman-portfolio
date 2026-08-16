import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE } from "@/lib/session";

// Everything under /cv-maker/* is part of the protected tool, except the
// public landing page (/cv-maker) and the login form (/cv-maker/login).
function isProtectedCvMakerRoute(pathname: string): boolean {
  return pathname.startsWith("/cv-maker/") && pathname !== "/cv-maker/login";
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthenticated = Boolean(request.cookies.get(ACCESS_COOKIE)?.value);

  if (isProtectedCvMakerRoute(pathname) && !isAuthenticated) {
    const loginUrl = new URL("/cv-maker/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/cv-maker/login" && isAuthenticated) {
    return NextResponse.redirect(new URL("/cv-maker/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/cv-maker/:path*"],
};
