import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ACCESS_COOKIE, REFRESH_COOKIE, accessCookieOptions } from "@/lib/session";

export const runtime = "edge";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Every authenticated request from the browser goes through this route
// instead of straight to Django. That lets us read the httpOnly JWT cookies
// (invisible to client JS) here on the server, attach them as a Bearer
// token, and — if the access token has expired — silently refresh it and
// retry before the caller ever sees a 401.

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  const res = await fetch(`${API_URL}/api/auth/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh: refreshToken }),
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  return typeof data?.access === "string" ? data.access : null;
}

async function forward(
  request: NextRequest,
  path: string[],
  accessToken: string | undefined
): Promise<Response> {
  const url = `${API_URL}/api/${path.join("/")}/${request.nextUrl.search}`;
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  if (accessToken) headers.set("authorization", `Bearer ${accessToken}`);

  const method = request.method;
  const hasBody = method !== "GET" && method !== "HEAD";

  return fetch(url, {
    method,
    headers,
    body: hasBody ? await request.text() : undefined,
  });
}

async function handler(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  const { path } = await context.params;
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;

  let upstream = await forward(request, path, accessToken);
  let refreshedAccessToken: string | null = null;

  if (upstream.status === 401 && refreshToken) {
    refreshedAccessToken = await refreshAccessToken(refreshToken);
    if (refreshedAccessToken) {
      upstream = await forward(request, path, refreshedAccessToken);
    }
  }

  const responseHeaders = new Headers();
  for (const name of ["content-type", "content-disposition"]) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }

  // Responses with these statuses must not have a body (Fetch spec); passing
  // one to the Response constructor throws even if it's zero-length.
  const isNullBodyStatus = [101, 204, 205, 304].includes(upstream.status);
  const body = isNullBodyStatus ? null : await upstream.arrayBuffer();
  const response = new NextResponse(body, {
    status: upstream.status,
    headers: responseHeaders,
  });

  if (refreshedAccessToken) {
    response.cookies.set(ACCESS_COOKIE, refreshedAccessToken, accessCookieOptions);
  }

  return response;
}

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
};
