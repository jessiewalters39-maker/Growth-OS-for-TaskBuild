import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads, type NewLead, type Lead } from "@/lib/schema";
import { eq } from "drizzle-orm";
import {
  apifyConfigured,
  runGoogleMapsScrape,
  normalizePlace,
  type LeadCandidate,
} from "@/lib/apify";
import { enrichMany } from "@/lib/enrich";
import { normEmail } from "@/lib/match";
import { getAppSettings } from "@/lib/settings";
import { askJson } from "@/lib/ai";
import { scorePrompt, type ScoreResult } from "@/lib/prompts";

// nodemailer/fetch enrichment + Anthropic need the Node runtime, not edge.
export const runtime = "nodejs";
// Scrape + website enrichment + scoring is slow; allow a long budget. Requires a
// Vercel plan that permits it (hobby caps at 60s). Local dev is unbounded.
export const maxDuration = 300;

const MAX_LIMIT = 50;

// POST /api/leads/scrape  body: { niche, location, limit }
// Runs the Apify Google Maps scraper, enriches each business's website for the
// chatbot signal + a contact email, dedupes, inserts, then AI-scores. Returns a
// summary the UI shows after the run.
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
  const limit = Math.max(1, Math.min(MAX_LIMIT, Number(body.limit) || 20));
  if (!niche || !location) {
    return NextResponse.json(
      { error: "niche and location are required" },
      { status: 400 },
    );
  }

  // 1) Scrape Google Maps.
  let candidates: LeadCandidate[];
  try {
    const places = await runGoogleMapsScrape({ niche, location, limit });
    candidates = places
      .map(normalizePlace)
      .filter((c): c is LeadCandidate => c !== null);
  } catch (e) {
    return NextResponse.json(
      { error: `scrape failed: ${String(e)}` },
      { status: 502 },
    );
  }
  const found = candidates.length;
  if (!found) {
    return NextResponse.json({ found: 0, inserted: 0, skipped: 0, leads: [] });
  }

  // 2) Dedupe against existing leads (email, else company+city), and within the
  //    batch — mirrors the CSV import rules.
  const existing = await db
    .select({ email: leads.email, company: leads.company, city: leads.city })
    .from(leads);
  const emailSet = new Set(
    existing.map((r) => r.email).filter(Boolean) as string[],
  );
  const companyCitySet = new Set(
    existing
      .filter((r) => !r.email)
      .map((r) => `${r.company.toLowerCase()}|${(r.city ?? "").toLowerCase()}`),
  );

  const fresh: LeadCandidate[] = [];
  let skipped = 0;
  for (const c of candidates) {
    const email = normEmail(c.email);
    if (email) {
      if (emailSet.has(email)) {
        skipped++;
        continue;
      }
      emailSet.add(email);
    } else {
      const key = `${c.company.toLowerCase()}|${(c.city ?? "").toLowerCase()}`;
      if (companyCitySet.has(key)) {
        skipped++;
        continue;
      }
      companyCitySet.add(key);
    }
    fresh.push({ ...c, email });
  }

  // 3) Enrich each fresh candidate's website (chatbot signal + email fallback).
  const enrichments = await enrichMany(fresh, (c) => c.website);

  const settings = await getAppSettings();
  const toInsert: NewLead[] = fresh.map((c) => {
    const e = enrichments.get(c);
    return {
      company: c.company,
      email: normEmail(c.email) || normEmail(e?.email ?? null),
      phone: c.phone,
      website: c.website,
      city: c.city,
      state: c.state,
      industry: niche,
      source: "Scrape",
      status: "new",
      hasChatbot: e?.hasChatbot ?? null,
      chatbotVendor: e?.chatbotVendor ?? null,
    };
  });

  // 4) Insert. onConflictDoNothing on email guards races; returns inserted rows.
  const inserted = await db
    .insert(leads)
    .values(toInsert)
    .onConflictDoNothing({ target: leads.email })
    .returning();
  skipped += toInsert.length - inserted.length;

  // 5) AI-score the inserted leads (best-effort, small concurrency). Chatbot
  //    signal flows in via scorePrompt → leadFacts.
  await scoreAll(inserted, settings);

  const withoutChatbot = inserted.filter((l) => l.hasChatbot === false).length;
  const withChatbot = inserted.filter((l) => l.hasChatbot === true).length;

  return NextResponse.json({
    found,
    inserted: inserted.length,
    skipped,
    withoutChatbot, // the hot prospects: no chat widget on their site
    withChatbot,
    unknownChatbot: inserted.length - withoutChatbot - withChatbot,
  });
}

async function scoreAll(
  rows: Lead[],
  settings: Awaited<ReturnType<typeof getAppSettings>>,
  concurrency = 4,
): Promise<void> {
  let i = 0;
  async function worker() {
    while (i < rows.length) {
      const lead = rows[i++];
      try {
        const r = await askJson<ScoreResult>(scorePrompt(lead, settings), 300);
        const tier = ["Hot", "Warm", "Cold"].includes(r.tier) ? r.tier : "Warm";
        const score = Math.max(1, Math.min(100, Math.round(r.score) || 1));
        await db
          .update(leads)
          .set({ tier, score, scoreReason: r.reason })
          .where(eq(leads.id, lead.id));
      } catch {
        // leave unscored — founder can score from the drawer
      }
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, rows.length) }, worker),
  );
}
