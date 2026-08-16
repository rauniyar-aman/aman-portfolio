import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  accessCookieOptions,
  refreshCookieOptions,
} from "@/lib/session";

// Called by the login page right after it receives {access, refresh} from
// the Django token endpoint. Storing them here as httpOnly cookies is what
// keeps the JWTs out of reach of client-side JS/localStorage.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const access = body?.access;
  const refresh = body?.refresh;

  if (typeof access !== "string" || typeof refresh !== "string") {
    return NextResponse.json({ detail: "access and refresh tokens are required" }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ACCESS_COOKIE, access, accessCookieOptions);
  response.cookies.set(REFRESH_COOKIE, refresh, refreshCookieOptions);
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(ACCESS_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);
  return response;
}
