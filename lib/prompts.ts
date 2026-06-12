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
export type SequenceMessage = { label: string; subject?: string; body: string };
export type SequencePayload = {
  emails: SequenceMessage[]; // 5: Initial, Follow-Up 1-3, Breakup
  sms: SequenceMessage[]; // 2
  linkedin: SequenceMessage[]; // 2
};

export function sequencePrompt(lead: Lead, settings: AppSettings): string {
  const name = lead.owner || "there";
  return `Write a complete cold outreach campaign for TaskBuildAI selling its AI employees (AI receptionist + lead qualification + 24/7 scheduling + instant SMS follow-up) to a home-service business. The single most important angle: missed calls = lost jobs. When the owner is on a roof, under a sink, or driving between jobs, every missed call is a customer who calls the next company instead. TaskBuildAI answers every call and books the job 24/7.

${mode(settings)}

Recipient:
${leadFacts(lead)}

Every message's only goal: get them to book a 15-minute demo. Personalize using their company name ("${lead.company}"), contact first name ("${name}"), their trade ("${lead.industry}"), and city${lead.city ? ` ("${lead.city}")` : ""}. Be specific to ${lead.industry}, not generic. Warm, direct, founder-to-owner tone. No fluff, no jargon. Short.

Produce exactly:
- 5 emails: labels "Initial", "Follow-Up 1", "Follow-Up 2", "Follow-Up 3", "Breakup". Each with a subject and a body. Emails escalate value then bow out politely on the breakup.
- 2 SMS messages (label "SMS 1", "SMS 2"): under 160 characters each, no subject.
- 2 LinkedIn messages (label "LinkedIn 1", "LinkedIn 2"): a connection note and a follow-up, no subject.

Respond with ONLY this JSON shape:
{"emails":[{"label":"Initial","subject":"...","body":"..."}, ...5 total],"sms":[{"label":"SMS 1","body":"..."},{"label":"SMS 2","body":"..."}],"linkedin":[{"label":"LinkedIn 1","body":"..."},{"label":"LinkedIn 2","body":"..."}]}`;
}
