import { db } from "./db";
import { customers, leads } from "./schema";
import { eq } from "drizzle-orm";
import { normEmail, promoteToCustomer } from "./match";

// Read-only pull of Stripe subscriptions. We never write to Stripe — use a
// RESTRICTED key with read access to Customers + Subscriptions only.
// MRR is each subscription's recurring amount normalized to a monthly figure.

const STRIPE_BASE = "https://api.stripe.com/v1";

export type StripeSyncResult = {
  fetched: number;
  upserted: number;
  matched: number;
  mrrCents: number;
  active: number;
  trialing: number;
  pastDue: number;
  canceled: number;
};

type StripeSub = {
  id: string;
  status: string;
  metadata?: Record<string, string>;
  customer?: string | { email?: string; metadata?: Record<string, string> };
  items?: {
    data?: Array<{
      quantity?: number;
      price?: {
        unit_amount?: number;
        recurring?: { interval?: string; interval_count?: number };
      };
    }>;
  };
};

// Normalize a subscription's recurring charge to monthly cents.
function subMrrCents(sub: StripeSub): number {
  let cents = 0;
  for (const item of sub.items?.data ?? []) {
    const price = item.price;
    if (!price?.unit_amount) continue;
    const qty = item.quantity ?? 1;
    let amt = price.unit_amount * qty;
    const interval = price.recurring?.interval;
    const count = price.recurring?.interval_count ?? 1;
    if (interval === "year") amt = amt / (12 * count);
    else if (interval === "week") amt = (amt * 52) / 12 / count;
    else if (interval === "day") amt = (amt * 365) / 12 / count;
    else amt = amt / count; // month (default)
    cents += amt;
  }
  return Math.round(cents);
}

export async function syncStripe(): Promise<StripeSyncResult> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not set");

  // Page through all subscriptions, expanding the customer for its email.
  const subs: StripeSub[] = [];
  let startingAfter: string | undefined;
  do {
    const params = new URLSearchParams({ status: "all", limit: "100" });
    params.append("expand[]", "data.customer");
    if (startingAfter) params.set("starting_after", startingAfter);
    const res = await fetch(`${STRIPE_BASE}/subscriptions?${params}`, {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Stripe ${res.status}: ${(await res.text()).slice(0, 200)}`);
    }
    const json = await res.json();
    const page: StripeSub[] = json?.data ?? [];
    subs.push(...page);
    startingAfter = json?.has_more && page.length ? page[page.length - 1].id : undefined;
  } while (startingAfter);

  const result: StripeSyncResult = {
    fetched: subs.length,
    upserted: 0,
    matched: 0,
    mrrCents: 0,
    active: 0,
    trialing: 0,
    pastDue: 0,
    canceled: 0,
  };

  for (const sub of subs) {
    const status = sub.status;
    const monthly = subMrrCents(sub);
    if (status === "active") result.active++;
    if (status === "trialing") result.trialing++;
    if (status === "past_due") result.pastDue++;
    if (status === "canceled") result.canceled++;
    if (status === "active" || status === "trialing") result.mrrCents += monthly;

    const cust = typeof sub.customer === "object" ? sub.customer : undefined;
    const email = normEmail(cust?.email ?? null);
    const industry =
      sub.metadata?.industry ?? cust?.metadata?.industry ?? null;

    let leadId: number | null = null;
    if (email) {
      const [lead] = await db
        .select({ id: leads.id })
        .from(leads)
        .where(eq(leads.email, email))
        .limit(1);
      if (lead) {
        leadId = lead.id;
        result.matched++;
      }
    }

    await db
      .insert(customers)
      .values({
        stripeId: sub.id,
        email,
        status,
        mrrCents: monthly,
        leadId,
        industry,
      })
      .onConflictDoUpdate({
        target: customers.stripeId,
        set: { email, status, mrrCents: monthly, leadId, industry, updatedAt: new Date() },
      });
    result.upserted++;

    if (leadId && (status === "active" || status === "trialing")) {
      await promoteToCustomer(leadId);
    }
  }

  return result;
}
