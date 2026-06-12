import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAME, verifyToken } from "@/lib/session";

// Next.js 16 "proxy" (formerly middleware). Protects every route except
// /login, /api/webhooks/*, and /api/jobs/* (those carry their own secrets).
// /api/auth/login is necessarily public too — otherwise you could never log in.
const PUBLIC_API = ["/api/auth/login", "/api/webhooks", "/api/jobs"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/login" || PUBLIC_API.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const ok = await verifyToken(req.cookies.get(COOKIE_NAME)?.value);
  if (ok) return NextResponse.next();

  // Unauthenticated API calls get a clean 401; pages redirect to /login.
  if (pathname.startsWith("/api")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  return NextResponse.redirect(url);
}

export const config = {
  // Run on everything except Next internals and static files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
