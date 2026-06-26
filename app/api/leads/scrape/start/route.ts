import { NextResponse } from "next/server";
import { apifyConfigured, startScrape } from "@/lib/apify";

export const runtime = "nodejs";

// POST /api/leads/scrape/start  body: { niche, location, limit }
// Queues an async Apify run and returns its id. Fast — the browser then polls
// /poll and processes results in chunks, so nothing here approaches the timeout.
export async function POST(req: Request) {
  if (!apifyConfigured()) {
    return NextResponse.json(
      { error: "Scraping isn't configured — set APIFY_TOKEN" },
      { status: 503 },
    );
  }
  const body = await req.json().catch(() => ({}));
  const niche = (body.niche || "").trim();
  const location = (body.location || "").trim();
  const limit = Math.max(1, Math.min(50, Number(body.limit) || 20));
  if (!niche || !location) {
    return NextResponse.json(
      { error: "niche and location are required" },
      { status: 400 },
    );
  }

  try {
    const runId = await startScrape({ niche, location, limit });
    return NextResponse.json({ runId });
  } catch (e) {
    return NextResponse.json(
      { error: `scrape start failed: ${String(e)}` },
      { status: 502 },
    );
  }
}
