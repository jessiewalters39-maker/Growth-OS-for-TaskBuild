import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads, type Lead } from "@/lib/schema";
import { inArray } from "drizzle-orm";
import { getAppSettings } from "@/lib/settings";
import { enrichAndScoreChunk } from "@/lib/leadgen";

export const runtime = "nodejs";
// A chunk of ~6 leads (website fetch + AI score each) finishes in well under a
// minute, so this is safe on a Hobby (60s) function. The browser calls it
// repeatedly, one chunk at a time, until every scraped lead is processed.
export const maxDuration = 60;

// POST /api/leads/scrape/enrich  body: { leadIds: number[] }
// Enriches + scores one chunk of just-scraped leads (chatbot signal + email,
// then AI fit score). Returns per-lead progress.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const ids: number[] = Array.isArray(body.leadIds)
    ? body.leadIds.map(Number).filter(Number.isInteger)
    : [];
  if (!ids.length) {
    return NextResponse.json({ error: "leadIds is required" }, { status: 400 });
  }
  // Guard the chunk size so the request can't blow the timeout.
  if (ids.length > 10) {
    return NextResponse.json(
      { error: "chunk too large — send at most 10 leadIds" },
      { status: 400 },
    );
  }

  const rows: Lead[] = await db
    .select()
    .from(leads)
    .where(inArray(leads.id, ids));
  const settings = await getAppSettings();
  const progress = await enrichAndScoreChunk(rows, settings);
  return NextResponse.json({ processed: progress });
}
