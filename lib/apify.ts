// Apify Google Maps scraper client. Runs the actor synchronously and returns the
// dataset items, which we normalize into lead candidates.
//
// Config is env-only:
//   APIFY_TOKEN     your Apify API token (Settings → Integrations → API tokens)
//   APIFY_ACTOR_ID  optional, defaults to the standard Google Maps scraper
//                   (compass/crawler-google-places). URL form uses "~" for "/".
//
// Note: run-sync can take a minute or more for larger result counts. Keep counts
// modest from a serverless route (Vercel function timeout); local runs are fine.

const DEFAULT_ACTOR = "compass~crawler-google-places";

export function apifyConfigured(): boolean {
  return Boolean(process.env.APIFY_TOKEN);
}

// One business as returned by the Google Maps actor (only the fields we use).
export type ApifyPlace = {
  title?: string;
  phone?: string;
  phoneUnformatted?: string;
  website?: string;
  city?: string;
  state?: string;
  address?: string;
  categoryName?: string;
  emails?: string[];
  url?: string; // google maps listing url
};

// A normalized lead candidate, before dedupe/insert.
export type LeadCandidate = {
  company: string;
  phone: string | null;
  website: string | null;
  city: string | null;
  state: string | null;
  email: string | null;
};

export type ScrapeInput = {
  niche: string; // e.g. "Roofing"
  location: string; // e.g. "Austin, TX"
  limit: number; // max businesses to pull
};

// Run the actor and return raw places. Throws on auth/HTTP errors.
export async function runGoogleMapsScrape(
  input: ScrapeInput,
): Promise<ApifyPlace[]> {
  const token = process.env.APIFY_TOKEN;
  if (!token) throw new Error("APIFY_TOKEN not set");
  const actor = process.env.APIFY_ACTOR_ID || DEFAULT_ACTOR;

  const body = {
    searchStringsArray: [`${input.niche} in ${input.location}`],
    locationQuery: input.location,
    maxCrawledPlacesPerSearch: input.limit,
    language: "en",
    // Keep the run lean/cheap: skip reviews and images, we only want contact data.
    maxReviews: 0,
    maxImages: 0,
    scrapeContacts: false, // we do our own website enrichment (chatbot + email)
  };

  const url = `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Apify run failed (${res.status}): ${text.slice(0, 300)}`);
  }

  const items = (await res.json()) as ApifyPlace[];
  return Array.isArray(items) ? items : [];
}

// Strip a phone to digits-ish, keep null if empty.
function clean(v: string | undefined | null): string | null {
  const s = (v ?? "").trim();
  return s.length ? s : null;
}

export function normalizePlace(p: ApifyPlace): LeadCandidate | null {
  const company = clean(p.title);
  if (!company) return null; // a place with no name is useless
  const email = (p.emails ?? []).map((e) => e.trim().toLowerCase())[0] || null;
  return {
    company,
    phone: clean(p.phone) || clean(p.phoneUnformatted),
    website: clean(p.website),
    city: clean(p.city),
    state: clean(p.state),
    email,
  };
}
