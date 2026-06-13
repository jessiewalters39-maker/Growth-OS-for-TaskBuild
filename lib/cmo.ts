import { db } from "./db";
import {
  bookings,
  cmoReports,
  customers,
  leads,
  metricsDaily,
  searchConsoleDaily,
} from "./schema";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { askJson } from "./ai";
import { cmoPrompt, type CmoData, type CmoPayload } from "./prompts";
import { getAppSettings } from "./settings";
import type { GscTopRow } from "./gsc";
import type { SearchConsoleDaily } from "./schema";

// GSC stores CTR as basis points and position x10 to stay integer; the report
// wants human units. ctr -> percent (1 decimal), position -> rank (1 decimal).
function organicSnapshot(row: SearchConsoleDaily | undefined) {
  if (!row) return null;
  return {
    date: row.date,
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: Math.round(row.ctrBps / 10) / 10,
    position: Math.round(row.positionX10) / 10,
  };
}

function topQueries(row: SearchConsoleDaily | undefined) {
  return ((row?.topQueries as GscTopRow[] | null) ?? []).map((r) => ({
    query: r.key,
    clicks: r.clicks,
    impressions: r.impressions,
    position: Math.round(r.positionX10) / 10,
  }));
}

function topPages(row: SearchConsoleDaily | undefined) {
  return ((row?.topPages as GscTopRow[] | null) ?? []).map((r) => ({
    page: r.key,
    clicks: r.clicks,
    impressions: r.impressions,
    position: Math.round(r.positionX10) / 10,
  }));
}

// The Monday (UTC) of the week containing `d`, as YYYY-MM-DD.
function mondayOf(d: Date): string {
  const day = d.getUTCDay(); // 0 Sun … 6 Sat
  const sinceMonday = (day + 6) % 7;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() - sinceMonday);
  return monday.toISOString().slice(0, 10);
}

// Gather ONLY real aggregates for the report — never synthetic data.
export async function gatherCmoData(): Promise<CmoData> {
  const ACTIVE = ["active", "trialing"];
  const [metrics, leadsBySource, bk, st, topHotLeads, organicRows] = await Promise.all([
    db
      .select()
      .from(metricsDaily)
      .orderBy(desc(metricsDaily.date))
      .limit(4),
    db
      .select({
        source: leads.source,
        total: sql<number>`count(*)::int`,
        demos: sql<number>`count(*) filter (where ${leads.status} in ('demo_booked','customer'))::int`,
        customers: sql<number>`count(*) filter (where ${leads.status} = 'customer')::int`,
      })
      .from(leads)
      .groupBy(leads.source)
      .orderBy(desc(sql`count(*)`)),
    db
      .select({
        accepted: sql<number>`count(*) filter (where ${bookings.status} = 'accepted')::int`,
        upcoming: sql<number>`count(*) filter (where ${bookings.status} = 'accepted' and ${bookings.startTime} > now())::int`,
        noShows: sql<number>`count(*) filter (where ${bookings.status} = 'no_show')::int`,
        cancelled: sql<number>`count(*) filter (where ${bookings.status} = 'cancelled')::int`,
      })
      .from(bookings),
    db
      .select({
        active: sql<number>`count(*) filter (where ${customers.status} = 'active')::int`,
        trialing: sql<number>`count(*) filter (where ${customers.status} = 'trialing')::int`,
        pastDue: sql<number>`count(*) filter (where ${customers.status} = 'past_due')::int`,
        canceled: sql<number>`count(*) filter (where ${customers.status} = 'canceled')::int`,
        mrrCents: sql<number>`coalesce(sum(${customers.mrrCents}) filter (where ${customers.status} in ('active','trialing')),0)::int`,
      })
      .from(customers),
    db
      .select({
        company: leads.company,
        industry: leads.industry,
        city: leads.city,
        tier: leads.tier,
        score: leads.score,
      })
      .from(leads)
      .where(inArray(leads.tier, ["Hot"]))
      .orderBy(desc(leads.score))
      .limit(5),
    db
      .select()
      .from(searchConsoleDaily)
      .orderBy(desc(searchConsoleDaily.date))
      .limit(2),
  ]);

  const [current, previous] = organicRows;
  const organic = current
    ? {
        current: organicSnapshot(current),
        previous: organicSnapshot(previous),
        topQueries: topQueries(current),
        topPages: topPages(current),
      }
    : null;

  return {
    metrics,
    leadsBySource,
    bookings: bk[0] ?? { accepted: 0, upcoming: 0, noShows: 0, cancelled: 0 },
    stripe: st[0] ?? { active: 0, trialing: 0, pastDue: 0, canceled: 0, mrrCents: 0 },
    topHotLeads,
    organic,
  };
}

export type GeneratedReport = {
  id: number;
  weekOf: string;
  payload: CmoPayload;
  createdAt: Date | null;
};

// Build the prompt from real data, call the model, persist, and return it.
export async function generateWeeklyCmo(): Promise<GeneratedReport> {
  const settings = await getAppSettings();
  const data = await gatherCmoData();
  const payload = await askJson<CmoPayload>(cmoPrompt(data, settings), 2000);

  const weekOf = mondayOf(new Date());
  const [row] = await db
    .insert(cmoReports)
    .values({ weekOf, payload })
    .returning();
  return {
    id: row.id,
    weekOf: row.weekOf,
    payload: row.payload as CmoPayload,
    createdAt: row.createdAt,
  };
}

// Latest report plus the previous 8 for the history list.
export async function getCmoReports() {
  const rows = await db
    .select()
    .from(cmoReports)
    .orderBy(desc(cmoReports.createdAt))
    .limit(9);
  return {
    latest: rows[0] ?? null,
    history: rows.slice(1),
  };
}

export async function getCmoReport(id: number) {
  const [row] = await db.select().from(cmoReports).where(eq(cmoReports.id, id)).limit(1);
  return row ?? null;
}
