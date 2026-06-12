import { db } from "./db";
import { bookings, leads } from "./schema";
import { eq } from "drizzle-orm";
import { normEmail, promoteToDemoBooked } from "./match";

// Read-only pull of recent Cal.com bookings (demos). Cal.com API v2.
// We fetch the most recent bookings, keep those touched in the last 14 days,
// upsert by uid, match attendees to leads by email, and promote matched leads
// to demo_booked when the booking is accepted.

const CAL_BASE = "https://api.cal.com/v2";
const CAL_API_VERSION = "2024-08-13";
const FOURTEEN_DAYS = 14 * 24 * 60 * 60 * 1000;
// Cal.com sits behind Cloudflare, which 403-blocks requests with the default
// Node fetch User-Agent. A real UA is required or the call fails outright.
const USER_AGENT = "TaskBuildAI-GrowthOS/1.0";

export type CalSyncResult = {
  fetched: number;
  upserted: number;
  matched: number;
};

// Defensive: Cal's exact JSON varies by version; extract fields with fallbacks.
function attendeeEmail(b: Record<string, unknown>): string | null {
  const attendees = b.attendees as Array<{ email?: string }> | undefined;
  if (attendees?.[0]?.email) return normEmail(attendees[0].email);
  const responses = b.responses as { email?: unknown } | undefined;
  const r = responses?.email;
  if (typeof r === "string") return normEmail(r);
  if (r && typeof r === "object" && "value" in r) {
    return normEmail(String((r as { value: unknown }).value));
  }
  return null;
}

function mapStatus(b: Record<string, unknown>): string {
  const s = String(b.status ?? "").toLowerCase();
  const attendees = b.attendees as Array<{ noShow?: boolean; absent?: boolean }> | undefined;
  if (s.includes("cancel")) return "cancelled";
  if (attendees?.some((a) => a.noShow || a.absent)) return "no_show";
  if (s.includes("accept")) return "accepted";
  if (s.includes("pending")) return "pending";
  return s || "pending";
}

export async function syncCalBookings(): Promise<CalSyncResult> {
  const key = process.env.CAL_API_KEY;
  if (!key) throw new Error("CAL_API_KEY not set");

  const res = await fetch(`${CAL_BASE}/bookings?take=100&sortStart=desc`, {
    headers: {
      Authorization: `Bearer ${key}`,
      "cal-api-version": CAL_API_VERSION,
      "User-Agent": USER_AGENT,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Cal.com ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  const json = await res.json();
  const list: Array<Record<string, unknown>> = Array.isArray(json?.data)
    ? json.data
    : [];

  const cutoff = Date.now() - FOURTEEN_DAYS;
  let upserted = 0;
  let matched = 0;

  for (const b of list) {
    const uid = (b.uid as string) ?? (b.id != null ? String(b.id) : null);
    if (!uid) continue;

    const updatedRaw = (b.updatedAt as string) ?? (b.start as string) ?? null;
    const updated = updatedRaw ? new Date(updatedRaw).getTime() : Date.now();
    if (updated < cutoff) continue;

    const email = attendeeEmail(b);
    const start = b.start ? new Date(b.start as string) : null;
    const status = mapStatus(b);

    let leadId: number | null = null;
    if (email) {
      const [lead] = await db
        .select({ id: leads.id })
        .from(leads)
        .where(eq(leads.email, email))
        .limit(1);
      if (lead) {
        leadId = lead.id;
        matched++;
      }
    }

    await db
      .insert(bookings)
      .values({ calUid: uid, email, status, startTime: start, leadId, raw: b })
      .onConflictDoUpdate({
        target: bookings.calUid,
        set: { email, status, startTime: start, leadId, raw: b },
      });
    upserted++;

    if (leadId && status === "accepted") await promoteToDemoBooked(leadId);
  }

  return { fetched: list.length, upserted, matched };
}
