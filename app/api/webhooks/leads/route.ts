import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { findExistingLead, normEmail } from "@/lib/match";
import { deriveChannel } from "@/lib/attribution";
import { getAppSettings } from "@/lib/settings";
import { askJson } from "@/lib/ai";
import { scorePrompt, type ScoreResult } from "@/lib/prompts";
import type { Lead } from "@/lib/schema";

// POST /api/webhooks/leads — TaskBuildAI website forms / chat / SMS post here.
// Header `x-webhook-secret` must equal LEAD_WEBHOOK_SECRET.
export async function POST(req: Request) {
  if (req.headers.get("x-webhook-secret") !== process.env.LEAD_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const company = (body.company || "").trim();
  const email = normEmail(body.email);
  if (!company && !email) {
    return NextResponse.json(
      { error: "company or email is required" },
      { status: 400 },
    );
  }

  const settings = await getAppSettings();
  const existing = await findExistingLead(email, company, body.city || null);

  let lead: Lead;
  let created: boolean;

  if (existing) {
    // Only fill fields that were previously empty — never overwrite real data.
    // (Spec: update source/landing_page only if previously empty; we apply the
    // same conservative rule to every field.)
    const patch: Partial<Lead> = { updatedAt: new Date() };
    const fillIfEmpty = (key: keyof Lead, value: string | null) => {
      if (value && !existing[key]) (patch as Record<string, unknown>)[key] = value;
    };
    fillIfEmpty("company", company || null);
    fillIfEmpty("owner", body.owner?.trim() || null);
    fillIfEmpty("email", email);
    fillIfEmpty("phone", body.phone?.trim() || null);
    fillIfEmpty("city", body.city?.trim() || null);
    fillIfEmpty("state", body.state?.trim() || null);
    fillIfEmpty("source", deriveChannel(body));
    fillIfEmpty("landingPage", body.landing_page?.trim() || null);
    [lead] = await db
      .update(leads)
      .set(patch)
      .where(eq(leads.id, existing.id))
      .returning();
    created = false;
  } else {
    [lead] = await db
      .insert(leads)
      .values({
        company: company || "(unknown)",
        owner: body.owner?.trim() || null,
        email,
        phone: body.phone?.trim() || null,
        city: body.city?.trim() || null,
        state: body.state?.trim() || null,
        industry: body.industry?.trim() || settings.industry,
        source: deriveChannel(body) || "Website Form",
        landingPage: body.landing_page?.trim() || null,
        status: "new",
      })
      .returning();
    created = true;
  }

  // Auto-score new leads (best effort — never fail the webhook on AI errors).
  if (created && !lead.score) {
    try {
      const r = await askJson<ScoreResult>(scorePrompt(lead, settings), 300);
      const tier = ["Hot", "Warm", "Cold"].includes(r.tier) ? r.tier : "Warm";
      const score = Math.max(1, Math.min(100, Math.round(r.score) || 1));
      await db
        .update(leads)
        .set({ tier, score, scoreReason: r.reason })
        .where(eq(leads.id, lead.id));
    } catch {
      // leave unscored; the founder can score manually from the drawer
    }
  }

  return NextResponse.json({ id: lead.id, created });
}
