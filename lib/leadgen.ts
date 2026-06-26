import { db } from "./db";
import { leads, type NewLead, type Lead } from "./schema";
import { eq } from "drizzle-orm";
import { normEmail } from "./match";
import { enrichWebsite } from "./enrich";
import { askJson } from "./ai";
import { scorePrompt, type ScoreResult } from "./prompts";
import type { LeadCandidate } from "./apify";
import type { AppSettings } from "./settings";

// Dedupe scraped candidates against existing leads (by email, else company+city)
// and within the batch, then bulk-insert the survivors as raw, unscored leads
// (chatbot status unknown until enrichment runs). Fast: one SELECT + one INSERT,
// so it stays well under the Hobby 60s budget even for a full batch.
export async function dedupeAndInsertRaw(
  candidates: LeadCandidate[],
  niche: string,
): Promise<{ inserted: Lead[]; skipped: number; found: number }> {
  const found = candidates.length;
  if (!found) return { inserted: [], skipped: 0, found: 0 };

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

  const toInsert: NewLead[] = [];
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
    toInsert.push({
      company: c.company,
      email,
      phone: c.phone,
      website: c.website,
      city: c.city,
      state: c.state,
      industry: niche,
      source: "Scrape",
      status: "new",
      // hasChatbot / chatbotVendor left null — filled by enrichAndScore later.
    });
  }

  if (!toInsert.length) return { inserted: [], skipped, found };

  const inserted = await db
    .insert(leads)
    .values(toInsert)
    .onConflictDoNothing({ target: leads.email })
    .returning();
  skipped += toInsert.length - inserted.length;
  return { inserted, skipped, found };
}

export type LeadProgress = {
  id: number;
  tier: string | null;
  score: number | null;
  hasChatbot: boolean | null;
  chatbotVendor: string | null;
};

// Enrich + score one lead: fetch its website for the chatbot signal and a
// fallback email, persist that, then AI-score (the chatbot signal flows into the
// prompt). Best-effort — a failed score still keeps the enrichment. Called per
// small chunk so each request stays under the function timeout.
async function enrichAndScoreOne(
  lead: Lead,
  settings: AppSettings,
): Promise<LeadProgress> {
  const e = await enrichWebsite(lead.website);
  // Persist enrichment; backfill email only if we didn't already have one.
  const email = lead.email || normEmail(e.email);
  const enriched: Lead = {
    ...lead,
    hasChatbot: e.hasChatbot,
    chatbotVendor: e.chatbotVendor,
    email,
  };
  await db
    .update(leads)
    .set({
      hasChatbot: e.hasChatbot,
      chatbotVendor: e.chatbotVendor,
      email,
      updatedAt: new Date(),
    })
    .where(eq(leads.id, lead.id));

  let tier: string | null = null;
  let score: number | null = null;
  try {
    const r = await askJson<ScoreResult>(scorePrompt(enriched, settings), 300);
    tier = ["Hot", "Warm", "Cold"].includes(r.tier) ? r.tier : "Warm";
    score = Math.max(1, Math.min(100, Math.round(r.score) || 1));
    await db
      .update(leads)
      .set({ tier, score, scoreReason: r.reason })
      .where(eq(leads.id, lead.id));
  } catch {
    // leave unscored — founder can score from the drawer
  }

  return {
    id: lead.id,
    tier,
    score,
    hasChatbot: e.hasChatbot,
    chatbotVendor: e.chatbotVendor,
  };
}

// Process a chunk of leads concurrently. Chunk size is chosen by the caller so
// the whole request finishes inside the function timeout.
export async function enrichAndScoreChunk(
  rows: Lead[],
  settings: AppSettings,
  concurrency = 6,
): Promise<LeadProgress[]> {
  const out: LeadProgress[] = [];
  let i = 0;
  async function worker() {
    while (i < rows.length) {
      out.push(await enrichAndScoreOne(rows[i++], settings));
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, rows.length) }, worker),
  );
  return out;
}
