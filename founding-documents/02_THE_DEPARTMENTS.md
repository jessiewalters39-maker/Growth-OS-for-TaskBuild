# The Departments
## Charters for the AI Growth Department
**Version 1.0 — July 2026**

*Growth OS thinks in departments, not modules. A department has a mission, a cadence, inputs it consumes, outputs it owes, and coworkers it serves. This document is the org design: nine departments that together cover every function a world-class growth organization performs — mapped for a small service business and staffed by AI.*

### How the classic functions map here

A Fortune-500 growth org runs ~18 named functions. At small-service-business scale, running them all separately is how agencies pad invoices. Growth OS consolidates them where the work genuinely overlaps:

| Classic function | Lives in |
|---|---|
| Demand Generation | **Growth Command** (as orchestration) + Paid Media + Search |
| SEO | **Search & Local Visibility** |
| Content, Brand | **Content & Social** (brand voice is a constraint on all departments, owned here) |
| Social Media | **Content & Social** |
| Outbound Sales, Prospecting, Lead Research | **Lead Research & Prospecting** + **Outbound** |
| Inbound Sales | **TaskBuild** (Receptionist + Sales Assistant) — see [04_THE_BRIDGE.md](04_THE_BRIDGE.md) |
| Email Marketing, Customer Marketing, Referral Marketing | **Lifecycle & Referral** |
| Paid Advertising | **Paid Media** |
| Partnerships, Community | **Lifecycle & Referral** (Phase 4 expands to a Partnerships desk) |
| Analytics, Revenue Operations, Conversion Optimization | **Analytics & Revenue Ops** |

Departments are **hired progressively** — the Growth Director turns them on in ladder order (warmest first), and a department that isn't hired doesn't exist in the owner's world. Every department obeys the Seven Laws; every handoff below is a written SLA in the Company Record, because handoffs without SLAs are where revenue leaks.

---

# 1 · Growth Command

**Mission:** *One plan, one report, one decision at a time — the owner leads growth without operating it.*

**Responsibilities:** Owns the growth plan and the primary-engine choice. Runs the department's operating calendar. Allocates effort (and later, budget) across departments. Produces the weekly growth review and the daily briefing line. Escalates exactly one decision at a time to the owner, with a recommendation attached.

- **Daily:** Read every department's output in the Company Record; set today's priorities; surface anything stuck; contribute the growth section of the owner's morning briefing.
- **Weekly:** The Growth Review — what moved, what didn't, why, and next week's plan. Pipeline by source. One recommendation with reasoning shown. The weekly experiment: one thing tried, one thing learned.
- **Monthly:** Engine health check — is the chosen compounding engine compounding? Cost per booked job trend. Rebalance department effort.
- **KPIs:** Leads per week by source · cost per booked job · owner minutes required per week (down is up) · recommendation adoption rate · plan-vs-actual honesty (did we do what we said).
- **Inputs:** Every department's outputs; TaskBuild capacity signals (the thermostat); owner decisions and vetoes; revenue truth from Analytics.
- **Outputs:** The weekly plan; the growth briefing; department priorities; the single escalated decision.
- **Collaboration:** Reads everyone, directs everyone. Receives capacity from TaskBuild's Office Manager and Dispatcher; returns demand forecasts. The Office Manager remains the company's single chief of staff and the Morning Briefing's one compiler; the Growth Director is a department head who contributes the growth section (Platform Amendment A1).
- **How AI changes the role:** A human CMO's scarcest resource is synthesis time — reading everything and holding the whole picture. The AI Growth Director reads *everything, every day, at full attention*, and its plan is grounded in the entire Company Record, not last month's memory of it. Strategy stops being quarterly guesswork and becomes a weekly, evidence-fed rhythm.

*This department already exists in v0: the weekly AI CMO report with worked/failed analysis, next-market recommendations, and a five-action plan.*

---

# 2 · Lead Research & Prospecting

**Mission:** *We always know exactly who we should be talking to, and why now.*

**Responsibilities:** Builds and maintains the map of the addressable market. Finds businesses/households matching the best-customer profile. Enriches every prospect from real sources (their website, their public presence). Watches for buying signals — the *why now*. Scores honestly, with reasons attached. Maintains list hygiene against the 22.5%/year decay.

- **Daily:** Sweep active signal sources (new leads in, seasonal triggers, local events like storm systems crossing service zips); enrich and score anything new; flag Hot prospects to Outbound within the 4-hour signal SLA.
- **Weekly:** Refresh the prospect pool for the current campaign; report signal quality (which signals actually converted); prune dead records.
- **Monthly:** Re-derive the best-customer profile from TaskBuild's actual closed jobs — the ICP is learned from won work, not written in onboarding and fossilized.
- **KPIs:** Hot-lead precision (did Hot leads actually convert better) · signal→touch latency · enrichment coverage (% of prospects with real research attached) · list decay rate.
- **Inputs:** TaskBuild's won/lost job history (what a best customer *is*); public web data; signal feeds; service-area geography.
- **Outputs:** Scored, enriched, reasoned prospect records; signal alerts; the ICP definition every other department targets.
- **Collaboration:** Feeds Outbound (who to contact) and Paid Media (audiences); consumes Analytics' conversion truth to recalibrate scoring; hands Search the "what do our best customers search for" brief.
- **How AI changes the role:** Prospect research was the classic junior-SDR grind — 15 minutes per account, done badly at 4 PM. AI does *real* research on every single prospect (reads their website, finds the actual signal, writes the actual reason) at a depth no human team sustains — which is precisely what makes low-volume, high-relevance outreach possible.

*Live in v0: scrape → enrich (website/contact/about pages, chatbot detection, social URLs) → AI score with reasons → tier.*

---

# 3 · Outbound

**Mission:** *The scary part is our job now. The owner never contacts a cold lead again.*

**Responsibilities:** Owns cold-stage contact end-to-end: sequence design, message drafting, sending (approval-gated), reply detection, persistence to the 5+ touches that 80% of conversions require, and the warm handoff. Enforces the compliance stack as a hard floor. Runs Tier-0 manual-assist for platforms that ban automation.

- **Daily:** Work the queue — draft touches for newly Hot prospects (every message must cite something true and specific from Research, or it stays in Draft); execute approved sends on schedule; detect replies and classify intent; hand warm replies across the Bridge *immediately*.
- **Weekly:** Sequence performance review — reply rate by message and by signal type; retire what's stale; propose one message experiment.
- **Monthly:** Deliverability audit (complaint rates, domain health, ramp compliance); channel mix review.
- **KPIs:** Warm conversations created · reply rate per touch (quality proxy) · handoff latency (reply → owner/TaskBuild) · deliverability health (complaint rate <0.1%) · follow-up coverage (zero prospects stranded mid-sequence).
- **Inputs:** Scored prospects with research from Lead Research; brand voice from Content; owner approvals from the Queue.
- **Outputs:** Warm conversations delivered across the Bridge with full context; sequence learnings; the touch history on every prospect record.
- **Collaboration:** Downstream of Research, upstream of TaskBuild's Receptionist/Sales Assistant (the handoff SLA: a warm reply reaches a responder in minutes, not hours). Reports send/reply stats to Analytics. Borrows proof (reviews, job stories) from Content and Reputation as message material.
- **How AI changes the role:** This is the department the owner was *never going to staff* — not with their own time (fear of self-promotion is the documented blocker) and not with a $60K SDR hire. AI removes the emotional cost entirely and the marginal labor cost almost entirely — which is exactly why the guardrails matter: the constraint on outbound is no longer effort, so it must be *quality, enforced in code*. Volume is capped by research depth, not by stamina.

*Live in v0: AI sequences (5 emails / 2 SMS / 2 LinkedIn), approval-gated SMTP sending, sent-touch tracking with auto-advance to Contacted, Tier-0 social open+copy buttons.*

---

# 4 · Lifecycle & Referral

**Mission:** *Nobody who ever trusted us is ever forgotten.*

**Responsibilities:** Owns the warmest audience — past customers and the dormant database. Reactivation by season and by system age. The referral program. The owned list (email/SMS) as the business's most durable asset. Win-backs. The "we did your gutters in 2024 — it's gutter season" institutional memory no small business retains on its own.

- **Daily:** Watch for lifecycle triggers (season change, service anniversary, warranty window, weather event touching a past customer's neighborhood); draft the outreach each trigger warrants.
- **Weekly:** Reactivation batch to the Queue — each message referencing the actual past job; referral asks queued for recently-delighted customers (timing signal from TaskBuild's Customer Success).
- **Monthly:** List hygiene (consent, bounces, decay repair); campaign calendar for the season ahead; revenue-recovered report.
- **KPIs:** Revenue recovered from dormant customers · reactivation response rate · referral rate (referred jobs / total new jobs) · list growth and health · repeat-customer share of revenue (the 44% number, tracked and grown).
- **Inputs:** TaskBuild's customer and job history (the goldmine); Customer Success sentiment signals; consent records; seasonal/weather triggers.
- **Outputs:** Booked repeat work; referral leads (tagged as such — they close 4x); the growing owned list; campaign material for Content to amplify.
- **Collaboration:** The clean line with TaskBuild's Sales Assistant, written once and enforced: **Sales Assistant works the active pipeline (open leads, live quotes); Lifecycle works the closed book (past customers, dormant records, campaigns).** One conversation, one owner, never a double-text. Feeds Reputation the "delighted customer" moments; feeds Research the referral-network map.
- **How AI changes the role:** Every owner knows they should do this; almost none do — it requires remembering thousands of customer-specific facts on customer-specific timing, forever. That's not discipline, that's a database with initiative. AI is the first labor force for which "never forget anyone, ever" is a trivial job requirement.

---

# 5 · Search & Local Visibility

**Mission:** *When someone in our service area needs what we do, we are what they find — and what they choose.*

**Responsibilities:** The Google Business Profile as the storefront: posts, photos, Q&A, categories, accuracy. Local rankings — map pack and organic — tracked against named competitors. Service pages and location pages that answer what searchers actually ask. Citation/listing consistency. Search Console truth. AEO: being the business the AI assistants cite when someone asks *"who should I call about a roof leak in Maple Grove?"*

- **Daily:** GBP freshness (post drafts from real job material); monitor new search queries appearing in Search Console; answer new GBP questions (drafted for approval).
- **Weekly:** Rank movement report on the keywords that map to revenue (not vanity terms); one page improved or one gap page briefed to Content.
- **Monthly:** Historical-optimization sprint (refresh aging pages — the elite-team standing workstream); listing consistency audit; competitor visibility delta.
- **KPIs:** Map-pack position for money keywords · GBP actions (calls, direction requests, website clicks) · organic leads per month · share of local voice vs. named competitors · pages published/refreshed.
- **Inputs:** Search Console + GBP data; keyword reality from Research ("what best customers search"); job stories and photos from TaskBuild via Content; reviews from Reputation (a direct ranking factor).
- **Outputs:** Rankings; the service-page library; content briefs; "questions customers keep asking" intelligence back to everyone.
- **Collaboration:** Tightest partnership is Reputation (reviews drive local rank) and Content (pages need words and proof). Hands Paid Media the proven-converting keywords worth paying for. TaskBuild's Receptionist reports the questions callers ask — which become the pages searchers find.
- **How AI changes the role:** Local SEO agencies charge $400–$2,500/mo largely for *diligence*: fresh posts, consistent listings, steady page production, patient monitoring. AI performs diligence natively and at zero marginal cost — and unlike the agency, it reads the actual jobs the business completes, so every page and post is grounded in real, local, specific work. The moat post-2024 isn't text volume (Google punishes that); it's authentic local proof, which only the system connected to operations possesses.

*Seeded in v0: Search Console ingestion with top queries/pages feeding the weekly report.*

---

# 6 · Reputation

**Mission:** *Public trust, compounding daily. The rating is the storefront.*

**Responsibilities:** Review velocity — asking at the emotional peak, every time (the timing signal comes from TaskBuild: job done, customer happy). Responding to every review, warm and specific, within hours. Negative-review triage with the owner in the loop, always. Monitoring across platforms. Turning five-star stories into material for everyone else.

- **Daily:** Detect completed-and-happy moments → queue review asks; draft responses to every new review; escalate anything negative immediately with context and a drafted, human-gated response.
- **Weekly:** Velocity and rating trend vs. the named competitors; hand the week's best stories to Content.
- **Monthly:** Platform coverage audit; review-source analysis (which jobs, crews, and job types generate praise — intelligence TaskBuild's Quality Inspector will want too).
- **KPIs:** Review velocity (the compounding number) · average rating trend · response time (100% responded, negatives in hours) · review→ranking lift (with Search) · rating vs. top competitor.
- **Inputs:** TaskBuild completion + sentiment signals; review platform feeds; brand voice.
- **Outputs:** The compounding review base; response record (88% of consumers favor businesses that respond); proof material; early-warning on quality issues.
- **Collaboration:** Timing from TaskBuild Customer Success; feeds Search (rank), Content (proof), Outbound (credibility material), and TaskBuild's operational quality loop (patterns in complaints).
- **How AI changes the role:** Review management fails at two human bottlenecks — remembering to ask at the right moment, and finding words to respond every single time. Both are trigger-plus-drafting problems, which is to say: both are exactly what AI does. Agencies charge $149–$599/mo for a worse version of this because they lack the completion signal Growth OS gets from TaskBuild for free.

---

# 7 · Content & Social

**Mission:** *Turn real work into public proof, everywhere the customer looks.*

**Responsibilities:** The job story engine: every completed job is potential content — before/after, the problem solved, the neighborhood served. Service-page and article production against Search's briefs, AI-drafted and human-approved (the post-2024 Google rule: assistance is fine, sloppy scale is fatal). Social presence: consistent, repurposed, real. Brand voice: one memory of how this business sounds, enforced across every department's drafts. Seasonal campaign creative for Lifecycle and Paid.

- **Daily:** Draft the day's social post from real material (a job, a review, a question a caller asked); one-source-many-formats repurposing.
- **Weekly:** Content standup against the calendar — one substantial piece (service page, job story, seasonal guide) drafted for approval; distribution of the week's proof across channels.
- **Monthly:** Refresh sprint with Search; brand-voice audit of everything shipped (does the department still sound like the owner?); photo/asset request list to the owner ("one photo from Tuesday's job" — small asks, never homework).
- **KPIs:** Publishing consistency (the streak, because consistency is what owners can't sustain) · content-assisted leads · engagement quality on proof posts · brand-voice pass rate · owner asks per month (down is up).
- **Inputs:** Job stories, photos, reviews from across the Record; briefs from Search; campaign needs from Lifecycle/Paid; the owner's actual voice (learned from their words, refined by their edits).
- **Outputs:** The public proof layer: pages, posts, stories; the brand voice memory every department writes with; creative for ads and campaigns.
- **Collaboration:** Everyone's supplier. Search provides the demand map; Reputation provides the trust material; TaskBuild provides the truth. Nothing is invented — Law 1 applied to marketing: *we only say what the Company Record can back.*
- **How AI changes the role:** Social posting is the #1 most-avoided owner task (51%). AI removes the blank page, the consistency burden, and the "what do I even post" paralysis — but the deeper change is *sourcing*: connected to operations, content stops being generic filler ("5 tips for spring!") and becomes what actually converts locally: proof of real work for real neighbors, published the week it happened.

---

# 8 · Paid Media

**Mission:** *Every dollar of spend buys a booked job, or it gets reallocated — and the budget breathes with the calendar.*

**Responsibilities:** Local Service Ads first (the proven local economics: ~6–9x closed ROAS in the trades); Google Search on keywords Search has proven convert; retargeting and seasonal social later. Budget pacing, creative rotation (from Content's proof material), negative-keyword hygiene, landing alignment with Analytics. Spend is *always* owner-approved — a hard approval floor autonomy never crosses.

- **Daily:** Pacing check; lead-quality watch (dispute junk LSA leads — the department does the arguing with Google, not the owner); pause anything anomalous, report why.
- **Weekly:** Cost per *booked job* by channel (never cost per click) reviewed in the Growth Review; creative and budget proposals.
- **Monthly:** Channel mix reallocation with evidence; seasonal budget plan for owner approval.
- **KPIs:** Cost per booked job by channel · ROAS on closed work (Analytics closes this loop) · wasted-spend caught · thermostat responsiveness (spend down within a day of a full calendar, up ahead of a thin one).
- **Inputs:** Budget authority from the owner; converting keywords from Search; audiences from Research; creative from Content; **capacity from TaskBuild — the thermostat's strongest lever.**
- **Outputs:** Paid leads (tagged by source into the Bridge); spend truth; market-price intelligence (what a lead costs — which also prices every "free" lead the other departments produce, and makes their briefings honest about value).
- **Collaboration:** Last engine staffed (Phase 4) because it's the only one that spends cash — it launches only when Analytics can already prove cost per booked job end-to-end. Tightest loop is with TaskBuild's calendar.
- **How AI changes the role:** PPC management is 10–20% of spend for a human's *periodic* attention. AI watches continuously, disputes junk leads tirelessly, and — the structural advantage — throttles to real operational capacity, which no agency can do because no agency can see the schedule board. The thermostat turns "ad budget" from a fixed monthly bet into a demand dial the company adjusts itself.

---

# 9 · Analytics & Revenue Ops

**Mission:** *One honest answer to "what's working?" — from first touch to invoice paid.*

**Responsibilities:** Attribution across the whole loop: every lead tagged at birth, every booking matched, every dollar traced (leads → demos → customers → MRR/job revenue). The metrics ledger every department steers by. Conversion optimization: where the funnel leaks (form abandons, quote-to-close by source, speed-to-lead compliance). Data hygiene and dedupe. The experiment log — what was tried, what was learned, so the department never re-learns what it already paid to know.

- **Daily:** Metrics snapshot; anomaly watch (source suddenly dry, conversion suddenly cliffed) surfaced to Growth Command same-day.
- **Weekly:** The numbers behind the Growth Review — pipeline by source with conversion truth, cost per booked job, SLA compliance (signal latency, handoff latency, speed-to-lead on the TaskBuild side of the Bridge).
- **Monthly:** Attribution deep-dive (which engine actually books jobs); funnel-leak report with one CRO recommendation; data-quality audit.
- **KPIs:** Attribution coverage (% of revenue with known source) · forecast accuracy · time-to-detect anomalies · funnel conversion by stage · experiment learnings logged.
- **Inputs:** Every event every department and TaskBuild employee writes to the Company Record; booking and payment truth.
- **Outputs:** The single source of truth; per-department KPI feeds; the leak report; the experiment ledger.
- **Collaboration:** Serves everyone, answers to reality. Recalibrates Research's scoring, judges Outbound's sequences, prices Paid's channels, and arms Growth Command's weekly review. In elite orgs this is RevOps + the growth-experiment machine; here it is also the *honesty enforcement* layer — Law 1's accountant.
- **How AI changes the role:** SMBs never get attribution — it requires instrumentation discipline no owner has time for, so they buy marketing on faith and fire agencies on vibes. Because Growth OS and TaskBuild share one Record, attribution is a *birthright of the architecture*, not a project: the system knows the lead's source the moment it books the job. "Figuring out what's working" — the #3 most time-consuming owner task — becomes a report that writes itself.

*Seeded in v0: source-tagged leads, booking/revenue matching by email, daily metrics snapshots, attribution lib.*

---

## The operating calendar (all departments, one rhythm)

| Cadence | What happens |
|---|---|
| **Daily** | Signal triage (4-hour SLA on Hot) · queue work · GBP/social freshness · review asks and responses · pacing and anomaly watch · the briefing line |
| **Weekly** | The Growth Review (pipeline by source, one recommendation, one decision) · content standup · sequence and reactivation batches to the Queue · rank movement |
| **Monthly** | Refresh sprint (content + pages) · deliverability and list-hygiene audits · attribution deep-dive · ICP re-derivation from won jobs · seasonal campaign planning |
| **Quarterly** | Engine re-evaluation (is the compounding engine compounding?) · department hire/pause proposals · competitor position review |

*Every SLA named in this document lives in the Company Record and is reported on, because a handoff without a deadline is where revenue goes to die.*
