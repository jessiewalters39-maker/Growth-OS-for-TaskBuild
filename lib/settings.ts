import { db } from "./db";
import { settings } from "./schema";
import { eq } from "drizzle-orm";

export type AppSettings = {
  industry: string;
  location: string;
  senderName: string;
};

export const DEFAULT_SETTINGS: AppSettings = {
  industry: "Roofing",
  location: "",
  senderName: "Jessie",
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
  const [industry, location, senderName] = await Promise.all([
    getSetting<string>("industry", DEFAULT_SETTINGS.industry),
    getSetting<string>("location", DEFAULT_SETTINGS.location),
    getSetting<string>("sender_name", DEFAULT_SETTINGS.senderName),
  ]);
  return { industry, location, senderName };
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } });
}
