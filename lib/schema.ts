import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  jsonb,
  date,
  unique,
} from "drizzle-orm/pg-core";

// ── leads: the core table ────────────────────────────────────────────────
// Note on dedupe: the build spec wrote "UNIQUE NULLS NOT DISTINCT (email)".
// Taken literally that would allow only ONE null-email row in the whole table,
// which breaks the product (many manual/CSV leads have no email). We instead
// use a normal UNIQUE on email (Postgres default = NULLS DISTINCT): non-null
// emails are deduped, multiple null emails are allowed, and code falls back to
// a (company, city) check when email is null. See lib/match.ts / import route.
export const leads = pgTable(
  "leads",
  {
    id: serial("id").primaryKey(),
    company: text("company").notNull(),
    owner: text("owner"), // contact person
    email: text("email"), // stored lowercase; used for matching
    phone: text("phone"),
    website: text("website"),
    city: text("city"),
    state: text("state"),
    industry: text("industry").notNull().default("Roofing"),
    source: text("source").notNull().default("Manual"), // Website Form | Chat | SMS | CSV Import | Manual
    landingPage: text("landing_page"),
    status: text("status").notNull().default("new"), // new | contacted | demo_booked | customer | lost
    tier: text("tier"), // Hot | Warm | Cold (AI)
    score: integer("score"), // 1-100 (AI)
    scoreReason: text("score_reason"), // AI explanation
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [unique("leads_email_unique").on(t.email)],
);

// ── sequences: AI-generated outreach campaigns ───────────────────────────
export const sequences = pgTable("sequences", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id")
    .notNull()
    .references(() => leads.id, { onDelete: "cascade" }),
  // payload: {emails:[{label,subject,body} x5], sms:[x2], linkedin:[x2]}
  payload: jsonb("payload").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ── bookings: Cal.com demos ──────────────────────────────────────────────
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  calUid: text("cal_uid").notNull().unique(),
  email: text("email"),
  status: text("status"), // accepted | cancelled | no_show | pending
  startTime: timestamp("start_time", { withTimezone: true }),
  leadId: integer("lead_id").references(() => leads.id), // matched by email
  raw: jsonb("raw"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ── customers: Stripe subscriptions (read-only mirror) ───────────────────
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  stripeId: text("stripe_id").notNull().unique(), // subscription id
  email: text("email"),
  status: text("status"), // active | trialing | past_due | canceled
  mrrCents: integer("mrr_cents").notNull().default(0),
  leadId: integer("lead_id").references(() => leads.id), // matched by email
  industry: text("industry"), // from Stripe metadata if present
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ── metrics_daily: one snapshot per day ──────────────────────────────────
export const metricsDaily = pgTable("metrics_daily", {
  date: date("date").primaryKey(),
  leadsTotal: integer("leads_total"),
  leadsNew7d: integer("leads_new_7d"),
  demosTotal: integer("demos_total"),
  demosUpcoming: integer("demos_upcoming"),
  noShows: integer("no_shows"),
  customersActive: integer("customers_active"),
  mrrCents: integer("mrr_cents"),
  churnedTotal: integer("churned_total"),
  pastDue: integer("past_due"),
});

// ── cmo_reports: weekly AI executive report ──────────────────────────────
export const cmoReports = pgTable("cmo_reports", {
  id: serial("id").primaryKey(),
  weekOf: date("week_of").notNull(),
  // payload: {headline, worked[], failed[], demosDriver, customersDriver,
  //           nextIndustry{}, nextMarket{}, actions[5]}
  payload: jsonb("payload").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ── settings: key/value config (industry, location, sync timestamps) ─────
export const settings = pgTable("settings", {
  key: text("key").primaryKey(), // 'industry' | 'location' | 'webhook_note' | 'last_cal_sync' | 'last_stripe_sync'
  value: jsonb("value").notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type Sequence = typeof sequences.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type MetricsDaily = typeof metricsDaily.$inferSelect;
export type CmoReport = typeof cmoReports.$inferSelect;
