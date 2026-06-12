import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth";

// Posted from the "Sign out" form in the top bar; clears the cookie and
// bounces back to /login.
export async function POST(req: Request) {
  await clearSession();
  return NextResponse.redirect(new URL("/login", req.url));
}
