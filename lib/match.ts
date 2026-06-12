import { db } from "./db";
import { leads } from "./schema";
import { and, eq, isNull, sql } from "drizzle-orm";
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
