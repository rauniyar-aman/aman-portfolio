// Shared cookie configuration for the httpOnly JWT session cookies.
// Only ever imported from Route Handlers (app/api/**/route.ts) — never from
// client components.

export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";

const isProduction = process.env.NODE_ENV === "production";

export const accessCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60, // 1 hour, matches backend SIMPLE_JWT ACCESS_TOKEN_LIFETIME
};

export const refreshCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days, matches backend REFRESH_TOKEN_LIFETIME
};
