import { NextResponse } from "next/server";
import {
  fetchDatasetItems,
  getRunStatus,
  isTerminal,
  normalizePlace,
  type LeadCandidate,
} from "@/lib/apify";
import { dedupeAndInsertRaw } from "@/lib/leadgen";

export const runtime = "nodejs";

// GET /api/leads/scrape/poll?runId=...&niche=...
// Reports the Apify run status. Once the run SUCCEEDS, it fetches the dataset,
// dedupes, and bulk-inserts the businesses as raw (unscored) leads — fast, one
// SELECT + one INSERT — then returns the new lead ids for the browser to enrich
// in chunks. While the run is still going it just returns { phase: "scraping" }.
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const runId = sp.get("runId");
  const niche = (sp.get("niche") || "").trim();
  if (!runId) {
    return NextResponse.json({ error: "runId is required" }, { status: 400 });
  }

  let status: string;
  try {
    status = await getRunStatus(runId);
  } catch (e) {
    return NextResponse.json(
      { error: `status check failed: ${String(e)}` },
      { status: 502 },
    );
  }

  if (!isTerminal(status)) {
    return NextResponse.json({ phase: "scraping", status });
  }
  if (status !== "SUCCEEDED") {
    return NextResponse.json({ phase: "error", error: `scrape ${status}` });
  }

  // Run finished — pull the dataset and insert.
  try {
    const items = await fetchDatasetItems(runId);
    const candidates = items
      .map(normalizePlace)
      .filter((c): c is LeadCandidate => c !== null);
    const { inserted, skipped, found } = await dedupeAndInsertRaw(
      candidates,
      niche || "Roofing",
    );
    return NextResponse.json({
      phase: "enrich",
      found,
      inserted: inserted.length,
      skipped,
      leadIds: inserted.map((l) => l.id),
    });
  } catch (e) {
    return NextResponse.json(
      { error: `ingest failed: ${String(e)}` },
      { status: 502 },
    );
  }
}
