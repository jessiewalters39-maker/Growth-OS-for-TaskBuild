import { db } from "./db";
import { bookings, customers, leads, metricsDaily } from "./schema";
import { and, eq, gt, gte, inArray, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";

// Computes today's funnel snapshot from the live tables and upserts one row
// into metrics_daily (PK = date), so re-running the cron on the same day
// overwrites rather than duplicates.

async function count(table: typeof leads | typeof bookings | typeof customers, where?: SQL) {
  const [row] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(table)
    .where(where);
  return row?.c ?? 0;
}

export type DailySnapshot = typeof metricsDaily.$inferInsert;

export async function writeDailyMetrics(): Promise<DailySnapshot> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const activeStatuses = ["active", "trialing"];

  const [
    leadsTotal,
    leadsNew7d,
    demosTotal,
    demosUpcoming,
    noShows,
    customersActive,
    churnedTotal,
    pastDue,
    mrrRow,
  ] = await Promise.all([
    count(leads),
    count(leads, gte(leads.createdAt, sevenDaysAgo)),
    count(bookings, eq(bookings.status, "accepted")),
    count(bookings, and(eq(bookings.status, "accepted"), gt(bookings.startTime, now))),
    count(bookings, eq(bookings.status, "no_show")),
    count(customers, inArray(customers.status, activeStatuses)),
    count(customers, eq(customers.status, "canceled")),
    count(customers, eq(customers.status, "past_due")),
    db
      .select({ mrr: sql<number>`coalesce(sum(${customers.mrrCents}),0)::int` })
      .from(customers)
      .where(inArray(customers.status, activeStatuses)),
  ]);

  const snapshot: DailySnapshot = {
    date: now.toISOString().slice(0, 10),
    leadsTotal,
    leadsNew7d,
    demosTotal,
    demosUpcoming,
    noShows,
    customersActive,
    mrrCents: mrrRow[0]?.mrr ?? 0,
    churnedTotal,
    pastDue,
  };

  await db
    .insert(metricsDaily)
    .values(snapshot)
    .onConflictDoUpdate({ target: metricsDaily.date, set: snapshot });

  return snapshot;
}
