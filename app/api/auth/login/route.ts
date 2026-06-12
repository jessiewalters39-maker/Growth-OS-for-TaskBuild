import { NextResponse } from "next/server";
import { setSession } from "@/lib/auth";

// Single shared password → signed httpOnly session cookie.
export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({ password: "" }));
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD not configured" },
      { status: 500 },
    );
  }
  if (typeof password !== "string" || password !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  await setSession();
  return NextResponse.json({ ok: true });
}
