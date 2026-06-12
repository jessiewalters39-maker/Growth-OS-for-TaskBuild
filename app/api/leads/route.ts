import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads } from "@/lib/schema";
import { and, eq, or, ilike, sql, type SQL } from "drizzle-orm";
import { normEmail } from "@/lib/match";

// Hot-first ordering: Hot > Warm > Cold > unscored, then score desc, newest.
const HOT_FIRST = sql`
  case ${leads.tier} when 'Hot' then 0 when 'Warm' then 1 when 'Cold' then 2 else 3 end,
  ${leads.score} desc nulls last,
  ${leads.createdAt} desc
`;

// GET /api/leads?status=&tier=&industry=&source=&q=
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const conds: SQL[] = [];
  if (sp.get("status")) conds.push(eq(leads.status, sp.get("status")!));
  if (sp.get("tier")) conds.push(eq(leads.tier, sp.get("tier")!));
  if (sp.get("industry")) conds.push(eq(leads.industry, sp.get("industry")!));
  if (sp.get("source")) conds.push(eq(leads.source, sp.get("source")!));

  const q = sp.get("q")?.trim();
  if (q) {
    const like = `%${q}%`;
    conds.push(
      or(
        ilike(leads.company, like),
        ilike(leads.owner, like),
        ilike(leads.email, like),
        ilike(leads.city, like),
      )!,
    );
  }

  const rows = await db
    .select()
    .from(leads)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(HOT_FIRST);

  return NextResponse.json(rows);
}

// POST /api/leads  — manual create. `company` required.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (!body.company || typeof body.company !== "string") {
    return NextResponse.json({ error: "company is required" }, { status: 400 });
  }
  try {
    const [row] = await db
      .insert(leads)
      .values({
        company: body.company.trim(),
        owner: body.owner?.trim() || null,
        email: normEmail(body.email),
        phone: body.phone?.trim() || null,
        website: body.website?.trim() || null,
        city: body.city?.trim() || null,
        state: body.state?.trim() || null,
        industry: body.industry || "Roofing",
        source: body.source || "Manual",
        landingPage: body.landing_page?.trim() || null,
        status: body.status || "new",
      })
      .returning();
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    if (String(e).includes("leads_email_unique")) {
      return NextResponse.json(
        { error: "A lead with that email already exists" },
        { status: 409 },
      );
    }
    throw e;
  }
}
