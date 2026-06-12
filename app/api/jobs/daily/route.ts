import { NextResponse } from "next/server";
import { syncCalBookings } from "@/lib/cal";
import { syncStripe } from "@/lib/stripe";
import { writeDailyMetrics } from "@/lib/metrics";
import { generateWeeklyCmo } from "@/lib/cmo";
import { setSetting } from "@/lib/settings";
import { retry } from "@/lib/retry";

// GET /api/jobs/daily — the single daily cron. Protected by CRON_SECRET
// (Authorization: Bearer <secret>). Each step is isolated in try/catch so one
// integration failing never blocks the others. Vercel Cron hits this once a day
// (see vercel.json); ?force=cmo forces the weekly report off-schedule.
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const ranAt = new Date().toISOString();
  const summary: Record<string, unknown> = { ranAt };

  // (1) Cal.com bookings → demos
  try {
    const cal = await retry(syncCalBookings);
    summary.cal = cal;
    await setSetting("last_cal_sync", { at: ranAt, ...cal });
  } catch (e) {
    summary.cal = { error: String(e) };
  }

  // (2) Stripe subscriptions → customers + MRR
  try {
    const stripe = await retry(syncStripe);
    summary.stripe = stripe;
    await setSetting("last_stripe_sync", { at: ranAt, ...stripe });
  } catch (e) {
    summary.stripe = { error: String(e) };
  }

  // (3) Daily metrics snapshot
  try {
    summary.metrics = await retry(writeDailyMetrics);
  } catch (e) {
    summary.metrics = { error: String(e) };
  }

  // (4) Weekly CMO report — Mondays (or ?force=cmo), from the data just synced.
  const isMonday = new Date().getUTCDay() === 1;
  const forceCmo = new URL(req.url).searchParams.get("force") === "cmo";
  if (isMonday || forceCmo) {
    try {
      const report = await generateWeeklyCmo();
      summary.cmo = { generated: true, weekOf: report.weekOf, id: report.id };
    } catch (e) {
      summary.cmo = { error: String(e) };
    }
  } else {
    summary.cmo = { skipped: "not Monday" };
  }

  return NextResponse.json(summary);
}
