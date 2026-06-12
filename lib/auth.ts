import { cookies } from "next/headers";
import { COOKIE_NAME, MAX_AGE_SECONDS, createToken, verifyToken } from "./session";

// Cookie helpers for route handlers / server components (use next/headers).
// Keep these out of session.ts so edge middleware can import the crypto alone.

export async function setSession(): Promise<void> {
  const token = await createToken();
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function isAuthed(): Promise<boolean> {
  const store = await cookies();
  return verifyToken(store.get(COOKIE_NAME)?.value);
}
