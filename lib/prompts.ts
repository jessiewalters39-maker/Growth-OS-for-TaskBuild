import type { Lead } from "./schema";
import type { AppSettings } from "./settings";

// Prompt builders. Every prompt is injected with the current industry/location
// mode so scoring, sequences, and the CMO all reason about the founder's target
// market. Each builder pairs with a token cap defined at the call site.

function leadFacts(lead: Lead): string {
  return [
    `Company: ${lead.company}`,
    lead.owner && `Contact: ${lead.owner}`,
    lead.industry && `Industry: ${lead.industry}`,
    (lead.city || lead.state) &&
      `Location: ${[lead.city, lead.state].filter(Boolean).join(", ")}`,
    lead.email && `Email: ${lead.email}`,
    lead.phone && `Phone: ${lead.phone}`,
    lead.website && `Website: ${lead.website}`,
    lead.hasChatbot === false &&
      `Website chatbot: NONE detected — the site has no chat/AI widget (prime fit: they lack what TaskBuildAI provides)`,
    lead.hasChatbot === true &&
      `Website chatbot: present${lead.chatbotVendor ? ` (${lead.chatbotVendor})` : ""} — they already run some chat tooling`,
    lead.source && `Lead source: ${lead.source}`,
    lead.landingPage && `Landing page: ${lead.landingPage}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function mode({ industry, location }: AppSettings): string {
  return `Target market: ${industry}${location ? ` businesses in ${location}` : " businesses"}.`;
}

// ── Lead scoring (max_tokens 300) ────────────────────────────────────────
export function scorePrompt(lead: Lead, settings: AppSettings): string {
  return `TaskBuildAI sells AI employees (AI receptionist, lead qualification, 24/7 scheduling, follow-up, SMS automation, website chat) to home-service businesses. The core pain: missed calls = lost jobs. A home-service owner who misses a call while on a roof or under a sink loses that customer to a competitor.

${mode(settings)}

Score this lead's fit as a prospect for that product. Weigh:
- Industry fit: does this business type rely on inbound phone calls and lose money to missed calls?
- Contactability: do we have an email and/or phone to reach them?
- Location fit: how well does their location match the target market above?
- Chatbot signal (weigh heavily when present): a business whose website has NO chat/AI widget is missing exactly what we sell — treat "no chatbot detected" as a strong positive buying signal and lean toward Hot. A business that already runs a chat widget has lower urgency for our website-chat angle (though missed-call capture may still apply), so temper the score. If the chatbot status is unknown, ignore this factor.

Lead:
${leadFacts(lead)}

Respond with ONLY this JSON shape:
{"tier":"Hot|Warm|Cold","score":<integer 1-100>,"reason":"<exactly 2 sentences explaining the score>"}`;
}

export type ScoreResult = {
  tier: "Hot" | "Warm" | "Cold";
  score: number;
  reason: string;
};

// ── Outreach sequence (max_tokens 1500) ──────────────────────────────────
export type SequenceMessage = {
  label: string;
  subject?: string;
  body: string;
  // Set when this email has been sent via /api/leads/[id]/send. Persisted back
  // into the sequence payload so the Sent state survives reloads.
  sentAt?: string;
};
export type SequencePayload = {
  emails: SequenceMessage[]; // 5: Initial, Follow-Up 1-3, Breakup
  sms: SequenceMessage[]; // 2
  linkedin: SequenceMessage[]; // 2
};

// ── Weekly CMO report (max_tokens 2000) ──────────────────────────────────
export type CmoData = {
  metrics: Array<Record<string, unknown>>; // last 4 daily snapshots
  leadsBySource: Array<{ source: string; total: number; demos: number; customers: number }>;
  bookings: { accepted: number; upcoming: number; noShows: number; cancelled: number };
  stripe: { active: number; trialing: number; pastDue: number; canceled: number; mrrCents: number };
  topHotLeads: Array<{ company: string; industry: string; city: string | null; tier: string | null; score: number | null }>;
  // Organic search (Google Search Console), the SEO top-of-funnel channel.
  // ctr is a percentage (1.5 = 1.5%); position is average rank (lower is better).
  // null until the GSC sync has run at least once.
  organic: {
    current: { date: string; clicks: number; impressions: number; ctr: number; position: number } | null;
    previous: { date: string; clicks: number; impressions: number; ctr: number; position: number } | null;
    topQueries: Array<{ query: string; clicks: number; impressions: number; position: number }>;
    topPages: Array<{ page: string; clicks: number; impressions: number; position: number }>;
  } | null;
};

export type CmoPayload = {
  headline: string;
  worked: string[];
  failed: string[];
  demosDriver: string;
  customersDriver: string;
  nextIndustry: { industry: string; why: string };
  nextMarket: { location: string; why: string };
  actions: string[]; // 5
};

export function cmoPrompt(data: CmoData, settings: AppSettings): string {
  return `You are the AI CMO for TaskBuildAI, which sells AI employees (AI receptionist, lead qualification, 24/7 scheduling, SMS follow-up) to home-service businesses. The founder's sole goal right now is the first 50 paying customers.

${mode(settings)}

You are given ONLY the real data below. Base every claim strictly on it. NEVER invent metrics, numbers, or trends. If a dataset needed for a recommendation is empty or zero, say so plainly and make the recommendation "populate that dataset" (e.g. "no demos booked yet — focus on booking the first demo"). MRR figures are in cents.

"organic" is the SEO / Google Search channel — the top of the funnel. Treat it as a leading indicator, separate from "leadsBySource" (which is captured leads and their conversions). Read it like this: impressions = how often the site showed in search, clicks = visits earned, position = average rank (LOWER is better; 1 is the top), ctr = click-through %. Compare "current" vs "previous" for the week-over-week trend, and use "topQueries"/"topPages" to see what demand exists. Diagnose accordingly — e.g. rising impressions but ~0 clicks or a high position number means the site ranks but on later pages (needs better titles and backlink authority, not more pages); strong impressions on a query the site has no dedicated page for is a content gap. If "organic" is null or all zeros, say organic search isn't producing yet and recommend the foundational SEO move. When relevant, factor the organic trend into "worked"/"failed"/"actions".

DATA (JSON):
${JSON.stringify(data, null, 2)}

Write a sharp weekly executive report. Be concrete and reference the actual numbers above. Respond with ONLY this JSON shape:
{"headline":"<one punchy sentence on the state of growth>","worked":["<what is working, grounded in the data>", ...],"failed":["<what is not working or is empty>", ...],"demosDriver":"<which source/channel actually produced demos, per the data>","customersDriver":"<what actually produced paying customers, per the data>","nextIndustry":{"industry":"<one home-service vertical to target next>","why":"<reason grounded in the data or stated as a hypothesis to test>"},"nextMarket":{"location":"<one geographic market to target next>","why":"<reason>"},"actions":["<action 1>","<action 2>","<action 3>","<action 4>","<action 5>"]}

"actions" must be exactly 5 prioritized, specific things to do in the next 7 days to move toward 50 customers.`;
}

export function sequencePrompt(lead: Lead, settings: AppSettings): string {
  const name = lead.owner || "there";
  const linkLines = [
    settings.bookingUrl
      ? `Booking link: ${settings.bookingUrl} — use it as the explicit call-to-action in every email and in the LinkedIn follow-up (e.g. "grab a 15-min slot here: ${settings.bookingUrl}").`
      : `No booking link is configured — the call-to-action must ask them to reply to set up a time. Do NOT invent a URL.`,
    settings.websiteUrl
      ? `Website: ${settings.websiteUrl} — reference it once where it reads naturally (e.g. the initial email or a sign-off) for credibility.`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
  return `Write a complete cold outreach campaign for TaskBuildAI selling its AI employees (AI receptionist + lead qualification + 24/7 scheduling + instant SMS follow-up) to a home-service business. The single most important angle: missed calls = lost jobs. When the owner is on a roof, under a sink, or driving between jobs, every missed call is a customer who calls the next company instead. TaskBuildAI answers every call and books the job 24/7.

${mode(settings)}

Recipient:
${leadFacts(lead)}

Every message's only goal: get them to book a 15-minute demo. Personalize using their company name ("${lead.company}"), contact first name ("${name}"), their trade ("${lead.industry}"), and city${lead.city ? ` ("${lead.city}")` : ""}. Be specific to ${lead.industry}, not generic. Warm, direct, founder-to-owner tone. No fluff, no jargon. Short.

Sender identity: every email and LinkedIn message is from "${settings.senderName}", the founder of TaskBuildAI. Sign off the emails as exactly "${settings.senderName}" (first name alone is fine) — NEVER invent, substitute, or vary the sender's name, and never use a placeholder like "[Your Name]". SMS messages need no sign-off.

Links (use these EXACTLY as given — never invent, alter, shorten, or use placeholder URLs like "[link]"):
${linkLines}

Produce exactly:
- 5 emails: labels "Initial", "Follow-Up 1", "Follow-Up 2", "Follow-Up 3", "Breakup". Each with a subject and a body. Emails escalate value then bow out politely on the breakup.
- 2 SMS messages (label "SMS 1", "SMS 2"): under 160 characters each, no subject.
- 2 LinkedIn messages (label "LinkedIn 1", "LinkedIn 2"): a connection note and a follow-up, no subject.

Respond with ONLY this JSON shape:
{"emails":[{"label":"Initial","subject":"...","body":"..."}, ...5 total],"sms":[{"label":"SMS 1","body":"..."},{"label":"SMS 2","body":"..."}],"linkedin":[{"label":"LinkedIn 1","body":"..."},{"label":"LinkedIn 2","body":"..."}]}`;
}
