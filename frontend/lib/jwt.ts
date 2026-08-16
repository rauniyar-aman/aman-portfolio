// Decodes a JWT payload for display purposes only — the signature is never
// verified here. Actual authorization always happens server-side (Django
// validates the signature on every proxied API call), so a tampered cookie
// can only ever change what a user sees rendered back to themselves.
export function decodeJwtPayload<T = Record<string, unknown>>(token: string): T | null {
  try {
    const payload = token.split(".")[1];
    const json = Buffer.from(payload, "base64").toString("utf-8");
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}
