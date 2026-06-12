import { NextResponse } from "next/server";
import { getAppSettings, setSetting } from "@/lib/settings";

// GET current industry/location mode; POST to update either (or both).
export async function GET() {
  return NextResponse.json(await getAppSettings());
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const writes: Promise<void>[] = [];
  if (typeof body.industry === "string")
    writes.push(setSetting("industry", body.industry));
  if (typeof body.location === "string")
    writes.push(setSetting("location", body.location));
  try {
    await Promise.all(writes);
  } catch {
    return NextResponse.json({ error: "save failed" }, { status: 500 });
  }
  return NextResponse.json(await getAppSettings());
}
