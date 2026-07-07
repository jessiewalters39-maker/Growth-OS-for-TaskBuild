import { db } from "./db";
import { settings } from "./schema";
import { eq } from "drizzle-orm";

export type AppSettings = {
  industry: string;
  location: string;
  senderName: string;
  dailySendCap: number;
  bookingUrl: string;
  websiteUrl: string;
  // Plain-text block appended to the bottom of every outreach email on send.
  // A Gmail signature can't apply here — it's a Gmail compose-window feature and
  // this app sends over SMTP, which never touches that UI — so we own the
  // signature ourselves. Kept plain text on purpose (see mailer.ts).
  signature: string;
};

export const DEFAULT_SETTINGS: AppSettings = {
  industry: "Roofing",
  location: "",
  senderName: "Jessie",
  dailySendCap: 30,
  bookingUrl: "https://cal.com/taskbuildai/automation-audit",
  websiteUrl: "https://www.taskbuildai.com/",
  signature:
    "Jessie Walters\n" +
    "Founder | TaskBuild\n" +
    "📧 jessie@taskbuildai.com\n" +
    "🌐 https://www.taskbuildai.com\n" +
    "📅 Book a Demo: https://cal.com/taskbuildai/automation-audit\n" +
    "\n" +
    "AI Departments for Service Businesses\n" +
    "\n" +
    "Front Office • Operations • Growth",
};

// Read a single setting value, JSON-typed. Returns fallback on any failure
// (missing DB, missing key) so pages render even before the DB is wired up.
export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  try {
    const rows = await db
      .select()
      .from(settings)
      .where(eq(settings.key, key))
      .limit(1);
    if (rows.length === 0) return fallback;
    return rows[0].value as T;
  } catch {
    return fallback;
  }
}

// Industry + location mode, injected into every AI prompt and the top bar.
export async function getAppSettings(): Promise<AppSettings> {
  const [
    industry,
    location,
    senderName,
    dailySendCap,
    bookingUrl,
    websiteUrl,
    signature,
  ] = await Promise.all([
    getSetting<string>("industry", DEFAULT_SETTINGS.industry),
    getSetting<string>("location", DEFAULT_SETTINGS.location),
    getSetting<string>("sender_name", DEFAULT_SETTINGS.senderName),
    getSetting<number>("daily_send_cap", DEFAULT_SETTINGS.dailySendCap),
    getSetting<string>("booking_url", DEFAULT_SETTINGS.bookingUrl),
    getSetting<string>("website_url", DEFAULT_SETTINGS.websiteUrl),
    getSetting<string>("signature", DEFAULT_SETTINGS.signature),
  ]);
  return {
    industry,
    location,
    senderName,
    dailySendCap,
    bookingUrl,
    websiteUrl,
    signature,
  };
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } });
}
