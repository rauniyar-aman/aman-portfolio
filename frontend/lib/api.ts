// Client-side API helper. Requests are sent to this app's own /api/proxy/*
// route, never straight to the Django API, so the browser can rely on
// same-origin httpOnly session cookies instead of holding the JWT in JS.
// The proxy route (app/api/proxy/[...path]/route.ts) attaches the access
// token and transparently refreshes it on a 401.

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const PROXY_PREFIX = "/api/proxy";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function extractErrorMessage(res: Response): Promise<string> {
  try {
    const data = await res.clone().json();
    if (typeof data?.detail === "string") return data.detail;
    return JSON.stringify(data);
  } catch {
    return res.statusText || `Request failed with status ${res.status}`;
  }
}

async function request(path: string, options: RequestInit = {}): Promise<Response> {
  // Next.js normalizes away trailing slashes on route handlers (redirecting
  // /api/proxy/cvs/ -> /api/proxy/cvs), so strip one here to avoid the extra
  // redirect hop; the proxy route re-adds it before calling Django, which
  // requires it.
  const normalizedPath = path.replace(/\/$/, "");
  const res = await fetch(`${PROXY_PREFIX}${normalizedPath}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (res.status === 401) {
    throw new ApiError(401, "Session expired. Please log in again.");
  }
  if (!res.ok) {
    throw new ApiError(res.status, await extractErrorMessage(res));
  }
  return res;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await request(path, { method: "GET" });
  return res.json();
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await request(path, {
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return res.json();
}

export async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  const res = await request(path, {
    method: "PUT",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return res.json();
}

export async function apiDelete(path: string): Promise<void> {
  await request(path, { method: "DELETE" });
}

function filenameFromContentDisposition(header: string | null, fallback: string): string {
  if (!header) return fallback;
  const match = /filename="?([^"]+)"?/.exec(header);
  return match ? match[1] : fallback;
}

export async function apiDownload(
  path: string,
  fallbackFilename: string
): Promise<{ blob: Blob; filename: string }> {
  const res = await request(path, { method: "GET" });
  const blob = await res.blob();
  const filename = filenameFromContentDisposition(
    res.headers.get("content-disposition"),
    fallbackFilename
  );
  return { blob, filename };
}

export function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
