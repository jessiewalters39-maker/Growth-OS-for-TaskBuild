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
