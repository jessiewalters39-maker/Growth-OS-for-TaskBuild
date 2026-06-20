import { NextResponse } from "next/server";
import { getAppSettings, setSetting } from "@/lib/settings";

// GET current industry/location/senderName mode; POST to update any of them.
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
  if (typeof body.sender_name === "string")
    writes.push(setSetting("sender_name", body.sender_name.trim() || "Jessie"));
  if (typeof body.daily_send_cap === "number" && body.daily_send_cap > 0)
    writes.push(setSetting("daily_send_cap", Math.floor(body.daily_send_cap)));
  if (typeof body.booking_url === "string")
    writes.push(setSetting("booking_url", body.booking_url.trim()));
  if (typeof body.website_url === "string")
    writes.push(setSetting("website_url", body.website_url.trim()));
  try {
    await Promise.all(writes);
  } catch {
    return NextResponse.json({ error: "save failed" }, { status: 500 });
  }
  return NextResponse.json(await getAppSettings());
}
