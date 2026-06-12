// Hand-rolled HMAC-signed session token. Uses Web Crypto only (no Node APIs,
// no next/headers) so this file is safe to import from edge middleware.
// Token format: `${payloadB64url}.${sigB64url}` where payload = {exp:<ms>}.

export const COOKIE_NAME = "tb_session";
export const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

const enc = new TextEncoder();
const dec = new TextDecoder();

function b64urlEncode(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(str: string): Uint8Array<ArrayBuffer> {
  let s = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4;
  if (pad) s += "=".repeat(4 - pad);
  const bin = atob(s);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacKey(): Promise<CryptoKey> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET not set");
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function createToken(): Promise<string> {
  const payload = b64urlEncode(
    enc.encode(JSON.stringify({ exp: Date.now() + MAX_AGE_SECONDS * 1000 })),
  );
  const key = await hmacKey();
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return `${payload}.${b64urlEncode(new Uint8Array(sig))}`;
}

export async function verifyToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  try {
    const key = await hmacKey();
    const ok = await crypto.subtle.verify(
      "HMAC",
      key,
      b64urlDecode(sig),
      enc.encode(payload),
    );
    if (!ok) return false;
    const data = JSON.parse(dec.decode(b64urlDecode(payload)));
    return typeof data.exp === "number" && data.exp > Date.now();
  } catch {
    return false;
  }
}
