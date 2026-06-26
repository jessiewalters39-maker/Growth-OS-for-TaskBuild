// Apify Google Maps scraper client. We run the actor ASYNCHRONOUSLY (start →
// poll status → fetch dataset) rather than run-sync, because the scrape can take
// minutes and a Vercel Hobby function is capped at 60s. The browser polls the
// status and then processes results in small chunks, so no single request runs
// long.
//
// Config is env-only:
//   APIFY_TOKEN     your Apify API token (Settings → Integrations → API tokens)
//   APIFY_ACTOR_ID  optional, defaults to the standard Google Maps scraper
//                   (compass/crawler-google-places). URL form uses "~" for "/".

const DEFAULT_ACTOR = "compass~crawler-google-places";
const API = "https://api.apify.com/v2";

export function apifyConfigured(): boolean {
  return Boolean(process.env.APIFY_TOKEN);
}

function token(): string {
  const t = process.env.APIFY_TOKEN;
  if (!t) throw new Error("APIFY_TOKEN not set");
  return t;
}

function actor(): string {
  return process.env.APIFY_ACTOR_ID || DEFAULT_ACTOR;
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

function buildActorInput(input: ScrapeInput) {
  return {
    searchStringsArray: [`${input.niche} in ${input.location}`],
    locationQuery: input.location,
    maxCrawledPlacesPerSearch: input.limit,
    language: "en",
    // Keep the run lean/cheap: we only want contact data, not reviews/images.
    maxReviews: 0,
    maxImages: 0,
    scrapeContacts: false, // we do our own website enrichment (chatbot + email)
  };
}

// Kick off an async actor run. Returns the run id. Fast (just queues the run).
export async function startScrape(input: ScrapeInput): Promise<string> {
  const res = await fetch(
    `${API}/acts/${actor()}/runs?token=${encodeURIComponent(token())}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(buildActorInput(input)),
    },
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Apify start failed (${res.status}): ${text.slice(0, 300)}`);
  }
  const json = (await res.json()) as { data?: { id?: string } };
  const id = json.data?.id;
  if (!id) throw new Error("Apify start returned no run id");
  return id;
}

// Apify run lifecycle states. Terminal: SUCCEEDED | FAILED | ABORTED | TIMED-OUT.
export type RunStatus = string;

export async function getRunStatus(runId: string): Promise<RunStatus> {
  const res = await fetch(
    `${API}/actor-runs/${runId}?token=${encodeURIComponent(token())}`,
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Apify status failed (${res.status}): ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as { data?: { status?: string } };
  return json.data?.status ?? "UNKNOWN";
}

export function isTerminal(status: RunStatus): boolean {
  return ["SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"].includes(status);
}

// Fetch the run's dataset items (the scraped businesses).
export async function fetchDatasetItems(runId: string): Promise<ApifyPlace[]> {
  const res = await fetch(
    `${API}/actor-runs/${runId}/dataset/items?token=${encodeURIComponent(token())}&clean=true`,
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Apify dataset fetch failed (${res.status}): ${text.slice(0, 200)}`);
  }
  const items = (await res.json()) as ApifyPlace[];
  return Array.isArray(items) ? items : [];
}

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
