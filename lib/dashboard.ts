import { db } from "./db";
import { bookings, cmoReports, customers, leads, metricsDaily } from "./schema";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { getSetting } from "./settings";

export type TrendPoint = {
  date: string;
  leads: number | null;
  demos: number | null;
  customers: number | null;
  mrr: number | null;
};

export type DashboardData = {
  funnel: { leads: number; demos: number; customers: number; mrrCents: number };
  bySource: { source: string; total: number; demos: number; customers: number }[];
  trend: TrendPoint[];
  cmoHeadline: string | null;
  cmoWeekOf: string | null;
  freshness: { cal: string | null; stripe: string | null };
};

const ACTIVE = ["active", "trialing"];

// One batch of aggregates for the homepage. Used by both the dashboard page
// (server component, called directly) and GET /api/dashboard.
export async function getDashboard(): Promise<DashboardData> {
  const [
    leadsTotalRow,
    demosRow,
    customersRow,
    bySource,
    trend,
    latestCmo,
    lastCal,
    lastStripe,
  ] = await Promise.all([
    db.select({ c: sql<number>`count(*)::int` }).from(leads),
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(bookings)
      .where(eq(bookings.status, "accepted")),
    db
      .select({
        c: sql<number>`count(*)::int`,
        mrr: sql<number>`coalesce(sum(${customers.mrrCents}),0)::int`,
      })
      .from(customers)
      .where(inArray(customers.status, ACTIVE)),
    db
      .select({
        source: leads.source,
        total: sql<number>`count(*)::int`,
        demos: sql<number>`count(*) filter (where ${leads.status} in ('demo_booked','customer'))::int`,
        customers: sql<number>`count(*) filter (where ${leads.status} = 'customer')::int`,
      })
      .from(leads)
      .groupBy(leads.source)
      .orderBy(desc(sql`count(*)`))
      .limit(5),
    db
      .select({
        date: metricsDaily.date,
        leads: metricsDaily.leadsTotal,
        demos: metricsDaily.demosTotal,
        customers: metricsDaily.customersActive,
        mrr: metricsDaily.mrrCents,
      })
      .from(metricsDaily)
      .orderBy(desc(metricsDaily.date))
      .limit(14),
    db
      .select({
        headline: sql<string>`${cmoReports.payload}->>'headline'`,
        weekOf: cmoReports.weekOf,
      })
      .from(cmoReports)
      .orderBy(desc(cmoReports.createdAt))
      .limit(1),
    getSetting<{ at?: string } | null>("last_cal_sync", null),
    getSetting<{ at?: string } | null>("last_stripe_sync", null),
  ]);

  return {
    funnel: {
      leads: leadsTotalRow[0]?.c ?? 0,
      demos: demosRow[0]?.c ?? 0,
      customers: customersRow[0]?.c ?? 0,
      mrrCents: customersRow[0]?.mrr ?? 0,
    },
    bySource,
    trend: trend.reverse(), // oldest → newest for sparklines
    cmoHeadline: latestCmo[0]?.headline ?? null,
    cmoWeekOf: latestCmo[0]?.weekOf ?? null,
    freshness: { cal: lastCal?.at ?? null, stripe: lastStripe?.at ?? null },
  };
}
