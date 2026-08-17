// Decodes a JWT payload for display purposes only — the signature is never
// verified here. Actual authorization always happens server-side (Django
// validates the signature on every proxied API call), so a tampered cookie
// can only ever change what a user sees rendered back to themselves.
//
// Uses Web-standard atob()/TextDecoder rather than Buffer — Buffer isn't
// guaranteed to exist on the Edge runtime (e.g. Cloudflare Workers without
// the nodejs_compat flag), while these are available everywhere: Node,
// browsers, and edge runtimes alike.
function base64UrlDecode(base64url: string): string {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function decodeJwtPayload<T = Record<string, unknown>>(token: string): T | null {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(base64UrlDecode(payload)) as T;
  } catch {
    return null;
  }
}
