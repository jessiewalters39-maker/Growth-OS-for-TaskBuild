// Website enrichment: fetch a business's homepage once and pull two signals out
// of the HTML — (1) does the site already run a chat/AI widget, and which vendor,
// and (2) a contact email if the scraper didn't already have one.
//
// The chatbot signal is the key qualifier for TaskBuildAI: a business with NO
// chat widget is missing exactly what we sell, so "no chatbot" makes a lead
// hotter. Detection is heuristic (signature matching on the homepage HTML) — a
// widget injected via an obscure tag manager can be missed — but it reliably
// catches the mainstream vendors below.

export type Socials = {
  linkedin: string | null;
  facebook: string | null;
  instagram: string | null;
  twitter: string | null;
};

export type Enrichment = {
  hasChatbot: boolean | null; // null = couldn't fetch the site (unknown)
  chatbotVendor: string | null;
  email: string | null;
  socials: Socials;
};

const EMPTY_SOCIALS: Socials = {
  linkedin: null,
  facebook: null,
  instagram: null,
  twitter: null,
};

// vendor name → substrings that appear in the page when that widget is present.
// Order matters only for the reported vendor name; any match means "has chatbot".
const CHATBOT_SIGNATURES: Array<[string, string[]]> = [
  ["Intercom", ["widget.intercom.io", "intercomcdn", "intercomSettings"]],
  ["Drift", ["js.driftt.com", "drift.com/include", "driftt.com"]],
  ["Tidio", ["code.tidio.co", "tidiochat", "tidio.co"]],
  ["Tawk.to", ["embed.tawk.to", "tawk.to"]],
  ["Crisp", ["client.crisp.chat", "crisp.chat"]],
  ["LiveChat", ["cdn.livechatinc.com", "livechatinc.com", "__lc.window"]],
  ["HubSpot Chat", ["js.usemessages.com", "js.hs-scripts.com"]],
  ["Zendesk Chat", ["static.zdassets.com", "zopim.com", "zopim", "zendesk"]],
  ["Freshchat", ["wchat.freshchat.com", "freshchat", "freshworks"]],
  ["Olark", ["olark.com", "olark"]],
  ["Podium", ["connect.podium.com", "podium.com/widget", "podium"]],
  ["Birdeye", ["birdeye.com", "bv-widget", "birdeye"]],
  ["Gorgias", ["gorgias.chat", "gorgias"]],
  ["JivoChat", ["code.jivosite.com", "jivosite", "jivo"]],
  ["Smartsupp", ["smartsuppchat", "smartsupp.com", "smartsupp"]],
  ["Chatra", ["call.chatra.io", "chatra.io", "chatra"]],
  ["Kommunicate", ["kommunicate.io", "kommunicate"]],
  ["LivePerson", ["lpcdn.lpsnmedia.net", "liveperson", "lpTag"]],
  ["Pure Chat", ["app.purechat.com", "purechat"]],
  ["ManyChat", ["manychat.com", "manychat"]],
  ["Gist", ["getgist.com", "gist.build", "gist"]],
  ["Landbot", ["landbot.io", "landbot"]],
  ["Voiceflow", ["voiceflow.com", "voiceflow"]],
  // Facebook Messenger needs the specific customer-chat plugin, not just the
  // pixel/SDK (connect.facebook.net alone is too broad).
  ["Facebook Messenger", ["fb-customerchat", "fb-customer-chat", "MessengerCheckbox", "dialog/customerchat"]],
];

function detectVendor(html: string): string | null {
  const h = html.toLowerCase();
  for (const [vendor, needles] of CHATBOT_SIGNATURES) {
    if (needles.some((n) => h.includes(n.toLowerCase()))) return vendor;
  }
  return null;
}

// Pull a plausible contact email from the page, preferring one whose domain
// matches the site (avoids grabbing wix.com / sentry / analytics addresses).
const JUNK_EMAIL_DOMAINS = [
  "example.com",
  "sentry.io",
  "wix.com",
  "wixpress.com",
  "godaddy.com",
  "squarespace.com",
  "schema.org",
  "googleapis.com",
];

function extractEmail(html: string, siteHost: string | null): string | null {
  const found = new Set<string>();
  // mailto: links first (highest signal), then any inline addresses.
  const mailtoRe = /mailto:([^"'?>\s]+)/gi;
  const emailRe = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
  let m: RegExpExecArray | null;
  while ((m = mailtoRe.exec(html))) found.add(m[1].trim().toLowerCase());
  while ((m = emailRe.exec(html))) found.add(m[0].trim().toLowerCase());

  const emails = [...found].filter((e) => {
    const domain = e.split("@")[1] ?? "";
    if (!domain) return false;
    if (JUNK_EMAIL_DOMAINS.some((j) => domain.endsWith(j))) return false;
    if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(e)) return false; // sprite junk
    return true;
  });
  if (!emails.length) return null;

  // Prefer an address on the site's own domain.
  if (siteHost) {
    const root = siteHost.replace(/^www\./, "");
    const onDomain = emails.find((e) => e.endsWith("@" + root) || e.endsWith("." + root));
    if (onDomain) return onDomain;
  }
  return emails[0];
}

// Pull the business's social profile URLs out of the page's links. We take the
// first link per network, skipping share/intent/sharer URLs (which are
// "share this page" buttons, not the business's own profile) and bare-root
// links like facebook.com with no handle.
const SOCIAL_PATTERNS: Array<[keyof Socials, RegExp]> = [
  ["linkedin", /https?:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/(?:company|in|pub)\/[A-Za-z0-9._%\-]+/i],
  ["facebook", /https?:\/\/(?:www\.|m\.|web\.)?facebook\.com\/(?!sharer|share|dialog|plugins|tr\b)[A-Za-z0-9.\-]+/i],
  ["instagram", /https?:\/\/(?:www\.)?instagram\.com\/(?!p\/|reel\/|explore\/)[A-Za-z0-9._]+/i],
  ["twitter", /https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/(?!intent|share|home\b)[A-Za-z0-9_]+/i],
];

function extractSocials(html: string): Socials {
  const out: Socials = { linkedin: null, facebook: null, instagram: null, twitter: null };
  for (const [network, re] of SOCIAL_PATTERNS) {
    const m = html.match(re);
    if (m) out[network] = m[0].replace(/["'\\].*$/, "").replace(/\/$/, "");
  }
  return out;
}

// Merge socials, keeping the first non-null per network (homepage wins over
// later contact pages).
function mergeSocials(base: Socials, next: Socials): Socials {
  return {
    linkedin: base.linkedin ?? next.linkedin,
    facebook: base.facebook ?? next.facebook,
    instagram: base.instagram ?? next.instagram,
    twitter: base.twitter ?? next.twitter,
  };
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function originOf(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

// Contact-ish pages where small businesses usually list an email when the
// homepage doesn't. Tried in order, stopping at the first email found.
const CONTACT_PATHS = ["/contact", "/contact-us", "/about"];

// Fetch one page's HTML (best-effort). Returns the body and the final URL after
// redirects, or null on any failure (timeout, block, non-2xx, DNS).
async function fetchHtml(
  url: string,
  timeoutMs: number,
): Promise<{ html: string; finalUrl: string } | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        // A real-ish UA — some sites 403 the default fetch agent.
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) return null;
    const html = (await res.text()).slice(0, 600_000); // cap huge pages
    return { html, finalUrl: res.url || url };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Fetch the homepage for the chatbot signal, then (only if no email turned up)
// check a couple of contact pages — that's where most local businesses bury
// their address. Best-effort: a failed homepage fetch yields hasChatbot=null.
export async function enrichWebsite(
  website: string | null,
  timeoutMs = 8000,
): Promise<Enrichment> {
  if (!website)
    return { hasChatbot: null, chatbotVendor: null, email: null, socials: EMPTY_SOCIALS };

  // Normalize to an absolute URL.
  let url = website.trim();
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;

  const home = await fetchHtml(url, timeoutMs);
  if (!home)
    return { hasChatbot: null, chatbotVendor: null, email: null, socials: EMPTY_SOCIALS };

  const vendor = detectVendor(home.html);
  const host = hostOf(home.finalUrl);
  let email = extractEmail(home.html, host);
  let socials = extractSocials(home.html);

  // No email on the homepage → try contact/about pages (shorter timeout each,
  // bounded so the per-lead budget stays well under the function limit). We also
  // merge any socials those pages carry — no extra fetches beyond the email hunt.
  if (!email) {
    const origin = originOf(home.finalUrl);
    if (origin) {
      for (const path of CONTACT_PATHS) {
        const page = await fetchHtml(origin + path, 4000);
        if (page) {
          if (!email) email = extractEmail(page.html, host);
          socials = mergeSocials(socials, extractSocials(page.html));
          if (email) break;
        }
      }
    }
  }

  return { hasChatbot: vendor !== null, chatbotVendor: vendor, email, socials };
}

// Run enrichment over many sites with a small concurrency cap so a scrape of
// dozens of leads doesn't open dozens of sockets at once.
export async function enrichMany<T>(
  items: T[],
  websiteOf: (t: T) => string | null,
  concurrency = 5,
): Promise<Map<T, Enrichment>> {
  const out = new Map<T, Enrichment>();
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      const item = items[idx];
      out.set(item, await enrichWebsite(websiteOf(item)));
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, worker),
  );
  return out;
}
