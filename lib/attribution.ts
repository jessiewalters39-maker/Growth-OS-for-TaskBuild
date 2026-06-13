// Marketing-channel attribution for inbound leads. The website should send the
// visitor's FIRST-TOUCH referrer + UTM params (captured at landing and stashed
// in a cookie/localStorage), since document.referrer at submit time is usually
// the site itself. We map those signals to a normalized channel that feeds the
// AI CMO report's leadsBySource breakdown — so "Organic Search" stands apart
// from "Paid Search", "Social", etc. instead of everything collapsing to
// "Website Form".

type Body = Record<string, unknown>;

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

const SOCIAL = [
  "facebook", "fb.", "instagram", "linkedin", "lnkd", "twitter", "x.com",
  "t.co", "youtube", "tiktok", "pinterest", "reddit",
];
const SEARCH = [
  "google.", "bing.", "yahoo.", "duckduckgo.", "ecosia.", "brave.",
  "baidu.", "yandex.", "search.",
];
const PAID_MEDIUM = /(^|[-_ ])(cpc|ppc|paid|paidsearch|sem|ads?)([-_ ]|$)/;

// Return a normalized marketing channel from referrer/UTM, or null when there
// is no positive signal (so callers can keep their existing default).
export function channelFromReferrer(body: Body): string | null {
  const utmMedium = str(body.utm_medium).toLowerCase();
  const utmSource = str(body.utm_source).toLowerCase();
  let referrer = str(body.referrer).toLowerCase();
  // A first-party referrer isn't a channel — ignore it.
  if (referrer.includes("taskbuildai.com")) referrer = "";

  if (!utmMedium && !utmSource && !referrer) return null;

  const fromSocial =
    utmMedium.includes("social") ||
    SOCIAL.some((s) => utmSource.includes(s) || referrer.includes(s));
  const fromSearch =
    SEARCH.some((s) => referrer.includes(s)) ||
    /google|bing|yahoo|duckduckgo/.test(utmSource);

  if (PAID_MEDIUM.test(utmMedium)) return fromSocial ? "Paid Social" : "Paid Search";
  if (utmMedium === "email") return "Email";
  if (fromSocial) return "Social";
  if (fromSearch) return "Organic Search";
  if (referrer) return "Referral";
  if (utmSource || utmMedium) return "Campaign";
  return null;
}

// The channel to record for a lead: an explicit `source` the caller sent always
// wins; otherwise derive from referrer/UTM; otherwise null (let the caller
// fall back to its own default, e.g. "Website Form").
export function deriveChannel(body: Body): string | null {
  const explicit = str(body.source);
  if (explicit) return explicit;
  return channelFromReferrer(body);
}
