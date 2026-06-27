import { db } from "./db";
import { leads } from "./schema";
import { and, eq, isNull, ne, notInArray, sql } from "drizzle-orm";
import type { Lead } from "./schema";

// Email-based matching is the v1 dedupe/linking strategy. No fuzzy matching.

export function normEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const e = email.trim().toLowerCase();
  return e.length > 0 ? e : null;
}

// Find an existing lead to merge an incoming record into: prefer email match,
// otherwise fall back to a case-insensitive (company, city) pair. Used by the
// webhook upsert and CSV import when the email is missing.
export async function findExistingLead(
  email: string | null,
  company: string,
  city: string | null,
): Promise<Lead | null> {
  if (email) {
    const byEmail = await db
      .select()
      .from(leads)
      .where(eq(leads.email, email))
      .limit(1);
    if (byEmail.length) return byEmail[0];
    return null;
  }
  // No email → match on company + city (both case-insensitive). Only matches
  // other rows that also have no email, to avoid colliding with real contacts.
  const cityCond = city
    ? sql`lower(${leads.city}) = ${city.toLowerCase()}`
    : isNull(leads.city);
  const byCompanyCity = await db
    .select()
    .from(leads)
    .where(
      and(
        sql`lower(${leads.company}) = ${company.toLowerCase()}`,
        cityCond,
        isNull(leads.email),
      ),
    )
    .limit(1);
  return byCompanyCity.length ? byCompanyCity[0] : null;
}

// ── Status auto-promotion (run during sync) ──────────────────────────────
// Rules: a lead matched to an accepted booking → demo_booked (never downgrade
// from demo_booked or customer); a lead matched to an active/trialing Stripe
// subscription → customer.

export async function promoteToDemoBooked(leadId: number): Promise<void> {
  await db
    .update(leads)
    .set({ status: "demo_booked", updatedAt: new Date() })
    .where(
      and(
        eq(leads.id, leadId),
        // never overwrite a further-along stage
        notInArray(leads.status, ["demo_booked", "customer"]),
      ),
    );
}

// Bump a lead to "contacted" the first time any outreach touch is sent. Only
// promotes from "new" (never downgrades a further-along stage). Returns the
// updated row when it actually changed, else null — so callers can tell the UI.
export async function markContacted(leadId: number): Promise<Lead | null> {
  const [row] = await db
    .update(leads)
    .set({ status: "contacted", updatedAt: new Date() })
    .where(and(eq(leads.id, leadId), eq(leads.status, "new")))
    .returning();
  return row ?? null;
}

export async function promoteToCustomer(leadId: number): Promise<void> {
  await db
    .update(leads)
    .set({ status: "customer", updatedAt: new Date() })
    .where(and(eq(leads.id, leadId), ne(leads.status, "customer")));
}
