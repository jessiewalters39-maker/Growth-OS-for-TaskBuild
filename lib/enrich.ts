// Website enrichment: fetch a business's homepage once and pull two signals out
// of the HTML — (1) does the site already run a chat/AI widget, and which vendor,
// and (2) a contact email if the scraper didn't already have one.
//
// The chatbot signal is the key qualifier for TaskBuildAI: a business with NO
// chat widget is missing exactly what we sell, so "no chatbot" makes a lead
// hotter. Detection is heuristic (signature matching on the homepage HTML) — a
// widget injected via an obscure tag manager can be missed — but it reliably
// catches the mainstream vendors below.

export type Enrichment = {
  hasChatbot: boolean | null; // null = couldn't fetch the site (unknown)
  chatbotVendor: string | null;
  email: string | null;
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

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

// Fetch the homepage and derive the signals. Best-effort: any failure (timeout,
// block, DNS) yields hasChatbot=null (unknown) rather than throwing.
export async function enrichWebsite(
  website: string | null,
  timeoutMs = 8000,
): Promise<Enrichment> {
  if (!website) return { hasChatbot: null, chatbotVendor: null, email: null };

  // Normalize to an absolute URL.
  let url = website.trim();
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;

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
    if (!res.ok) return { hasChatbot: null, chatbotVendor: null, email: null };
    const html = (await res.text()).slice(0, 600_000); // cap huge pages
    const vendor = detectVendor(html);
    return {
      hasChatbot: vendor !== null,
      chatbotVendor: vendor,
      email: extractEmail(html, hostOf(res.url || url)),
    };
  } catch {
    return { hasChatbot: null, chatbotVendor: null, email: null };
  } finally {
    clearTimeout(timer);
  }
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
