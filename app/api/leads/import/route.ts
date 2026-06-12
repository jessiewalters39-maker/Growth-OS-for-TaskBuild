import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads, type NewLead } from "@/lib/schema";
import { parseCsv, matchHeaders } from "@/lib/csv";
import { normEmail } from "@/lib/match";
import { getAppSettings } from "@/lib/settings";

// POST /api/leads/import  body: { csv: "raw text" }
// Parses, fuzzy-matches headers, dedupes by email then (company+city), inserts.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const csv = typeof body.csv === "string" ? body.csv : "";
  if (!csv.trim()) {
    return NextResponse.json({ error: "csv is empty" }, { status: 400 });
  }

  const rows = parseCsv(csv).filter((r) => r.some((c) => c.trim() !== ""));
  if (rows.length < 2) {
    return NextResponse.json({ inserted: 0, skipped: 0 });
  }
  const cols = matchHeaders(rows[0]);
  if (cols.company === undefined && cols.email === undefined) {
    return NextResponse.json(
      { error: "could not find a company or email column" },
      { status: 400 },
    );
  }

  const settings = await getAppSettings();
  const cell = (row: string[], field: string): string =>
    cols[field] !== undefined ? (row[cols[field]] ?? "").trim() : "";

  // Existing keys for dedupe (also grown within the batch).
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

  for (const row of rows.slice(1)) {
    const company = cell(row, "company");
    const email = normEmail(cell(row, "email"));
    if (!company && !email) {
      skipped++;
      continue;
    }
    if (email) {
      if (emailSet.has(email)) {
        skipped++;
        continue;
      }
      emailSet.add(email);
    } else {
      const key = `${company.toLowerCase()}|${cell(row, "city").toLowerCase()}`;
      if (companyCitySet.has(key)) {
        skipped++;
        continue;
      }
      companyCitySet.add(key);
    }
    toInsert.push({
      company: company || "(unknown)",
      owner: cell(row, "owner") || null,
      email,
      phone: cell(row, "phone") || null,
      website: cell(row, "website") || null,
      city: cell(row, "city") || null,
      state: cell(row, "state") || null,
      industry: cell(row, "industry") || settings.industry,
      source: cell(row, "source") || "CSV Import",
      landingPage: cell(row, "landingPage") || null,
      status: "new",
    });
  }

  let inserted = 0;
  if (toInsert.length) {
    // onConflictDoNothing on email is a DB-level safety net for any email dup
    // that slipped past the in-memory set (e.g. concurrent imports).
    const result = await db
      .insert(leads)
      .values(toInsert)
      .onConflictDoNothing({ target: leads.email })
      .returning({ id: leads.id });
    inserted = result.length;
    skipped += toInsert.length - inserted;
  }

  return NextResponse.json({ inserted, skipped });
}
