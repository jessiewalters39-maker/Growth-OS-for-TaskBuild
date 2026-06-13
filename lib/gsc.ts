import { db } from "./db";
import { searchConsoleDaily } from "./schema";

// Read-only pull of Google Search Console organic-search performance, used as
// the top-of-funnel "Organic" channel in the weekly AI CMO report. Auth is
// OAuth as the property owner (a refresh token minted once via
// scripts/gsc-auth.mjs) — no service-account key file, which a Google org
// policy (iam.disableServiceAccountKeyCreation) commonly blocks. We exchange
// the refresh token for a short-lived access token, then POST the Search
// Analytics query — same minimal-deps, fetch-only style as lib/cal.ts.
//
// Required env (the refresh token must belong to a Google account that owns or
// has access to the property; for a domain property GSC_SITE_URL is
// `sc-domain:example.com`):
//   GSC_CLIENT_ID      — OAuth client id
//   GSC_CLIENT_SECRET  — OAuth client secret
//   GSC_REFRESH_TOKEN  — long-lived refresh token from scripts/gsc-auth.mjs
//   GSC_SITE_URL      — e.g. `sc-domain:taskbuildai.com`

const TOKEN_URL = "https://oauth2.googleapis.com/token";
// GSC data lags ~2 days; query the 7-day window ending two days ago so every
// day in the window has settled data rather than a partial final day.
const LAG_DAYS = 2;
const WINDOW_DAYS = 7;
const TOP_N = 10;

export type GscTopRow = {
  key: string;
  clicks: number;
  impressions: number;
  ctrBps: number;
  positionX10: number;
};

export type GscSyncResult = {
  date: string;
  startDate: string;
  endDate: string;
  clicks: number;
  impressions: number;
  ctrBps: number;
  positionX10: number;
  topQueries: number;
  topPages: number;
};

type GscApiRow = {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
};

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Trade the stored refresh token for a fresh access token.
async function getAccessToken(): Promise<string> {
  const clientId = process.env.GSC_CLIENT_ID;
  const clientSecret = process.env.GSC_CLIENT_SECRET;
  const refreshToken = process.env.GSC_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "GSC_CLIENT_ID, GSC_CLIENT_SECRET and GSC_REFRESH_TOKEN must all be set",
    );
  }
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`GSC token ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new Error("GSC token: no access_token in response");
  return json.access_token;
}

async function queryAnalytics(
  token: string,
  siteUrl: string,
  body: Record<string, unknown>,
): Promise<GscApiRow[]> {
  const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(
    siteUrl,
  )}/searchAnalytics/query`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`GSC query ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  const json = (await res.json()) as { rows?: GscApiRow[] };
  return json.rows ?? [];
}

const toBps = (ctr: number | undefined) => Math.round((ctr ?? 0) * 10000);
const toPosX10 = (pos: number | undefined) => Math.round((pos ?? 0) * 10);

function mapTop(rows: GscApiRow[]): GscTopRow[] {
  return rows.map((r) => ({
    key: r.keys?.[0] ?? "(unknown)",
    clicks: Math.round(r.clicks ?? 0),
    impressions: Math.round(r.impressions ?? 0),
    ctrBps: toBps(r.ctr),
    positionX10: toPosX10(r.position),
  }));
}

export async function syncSearchConsole(): Promise<GscSyncResult> {
  const siteUrl = process.env.GSC_SITE_URL;
  if (!siteUrl) throw new Error("GSC_SITE_URL must be set");

  const end = new Date(Date.now() - LAG_DAYS * 24 * 60 * 60 * 1000);
  const start = new Date(end.getTime() - (WINDOW_DAYS - 1) * 24 * 60 * 60 * 1000);
  const startDate = ymd(start);
  const endDate = ymd(end);

  const token = await getAccessToken();

  const [totals, queries, pages] = await Promise.all([
    queryAnalytics(token, siteUrl, { startDate, endDate, dimensions: [] }),
    queryAnalytics(token, siteUrl, {
      startDate,
      endDate,
      dimensions: ["query"],
      rowLimit: TOP_N,
    }),
    queryAnalytics(token, siteUrl, {
      startDate,
      endDate,
      dimensions: ["page"],
      rowLimit: TOP_N,
    }),
  ]);

  const t = totals[0] ?? {};
  const clicks = Math.round(t.clicks ?? 0);
  const impressions = Math.round(t.impressions ?? 0);
  const ctrBps = toBps(t.ctr);
  const positionX10 = toPosX10(t.position);
  const topQueries = mapTop(queries);
  const topPages = mapTop(pages);

  // Snapshot is keyed on the window's end date (the freshest settled day).
  const date = endDate;
  const row = {
    date,
    clicks,
    impressions,
    ctrBps,
    positionX10,
    topQueries,
    topPages,
  };
  await db
    .insert(searchConsoleDaily)
    .values(row)
    .onConflictDoUpdate({ target: searchConsoleDaily.date, set: row });

  return {
    date,
    startDate,
    endDate,
    clicks,
    impressions,
    ctrBps,
    positionX10,
    topQueries: topQueries.length,
    topPages: topPages.length,
  };
}
