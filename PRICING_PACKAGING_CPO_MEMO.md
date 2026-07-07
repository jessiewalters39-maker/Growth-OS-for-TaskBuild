# CPO/CRO Memo: Challenging the Department Pricing Architecture

**Date:** July 7, 2026
**Status:** RATIFIED July 7, 2026 — see `founding-documents/06_GENERATION_ONE_RATIFICATION.md` for the official prices ($199/$499/$599/$899) and execution roadmap. This memo is the evidence record behind that ratification.
**Basis:** The ratified founding documents (Manifesto, Research Foundation, Departments, Employees, Bridge, Platform) tested against three independent research sweeps (~90 sources): suite/platform pricing history (Microsoft 365, HubSpot, Atlassian, Salesforce, ServiceTitan, Jobber, Housecall Pro), AI-employee/agent pricing 2025–2026 (11x, Artisan, Sierra, Intercom Fin, Decagon, Agentforce, Copilot, Breeze, plus the SMB receptionist market), and category creation / JTBD / buying-psychology literature.

---

## The verdict, up front

The core instinct is right and the evidence supports it: **departments as the customer-facing purchase unit, products as invisible architecture, one HQ, flat pricing.** But four pieces of the current thinking are wrong or dangerously underspecified:

1. **"Starter / Pro / Scale" is the wrong language for this strategy.** We built a company metaphor and then named the tiers like a file-storage app. Tier names should be the staffing story itself.
2. **Growth does not belong inside Scale.** Bundling the Growth department into a $699 software tier destroys its price integrity against the $2,500–$5,000/mo agency retainer it actually replaces. Growth should be a department SKU; the top tier should be the *bundle* of Operations + Growth, engineered with decoy math.
3. **The Sales Assistant is misplaced in Scale.** Quote follow-up is the single largest leak in our own research (48% of sellers never follow up; 60–75% of estimates die of silence, not price). That's warm-pipeline *operations* work and it belongs in the Operations tier, or the tier's core promise is gutted.
4. **"Growth OS" must never appear on a pricing page.** Amendment A2 and Law 6 already imply this; this memo makes it explicit. One brand, one budget line, one churn decision.

And one thing the proposal gets more right than it may realize: **employees must not be the purchase unit** — but not for the obvious reason. By 2032, "how many AI employees you get" will be a meaningless number; the org chart is the only durable pricing abstraction.

---

## Should customers buy employees, departments, outcomes, or capabilities?

**Not employees.** The market already ran this experiment. 11x priced per "digital worker" (~$40–60k/year, salary-anchored) and produced 70–80% churn, fabricated customer claims, and a founder exit — because employee framing sets employee-level expectations that the product then loses to. Commitment 10 ("never anchor to a salary we can't replace") already bans this; the market has since converged on exactly this position — post-11x, vendors are retreating to "AI front office," "AI workforce," "AI department" language, with the salary math in the ROI story rather than the headline. There's also a packaging mechanic: per-employee SKUs recreate Simon-Kucher's "killer feature" problem — a bundle containing an employee the buyer doesn't want makes them feel overcharged for the whole bundle. Employees are the product *experience*. They are not the SKU.

**Not outcomes.** Outcome billing is where enterprise AI pricing is heading (Sierra, Intercom's $0.99/resolution, HubSpot's April 2026 pay-per-result repricing) and it is wrong for this buyer:

- SMB volume is too low to average out variance — a roofer can't budget "$0.99 per something I can't predict."
- Documented bill shocks (Intercom customers going $1,200 → $10k/mo) are the "success tax" competitors' marketing already attacks.
- Attribution disputes — Decagon's own customers mostly *choose* per-conversation over per-resolution to avoid arguing about what "resolved" means; Salesforce publicly churned through three Agentforce pricing models in eighteen months for the same reason.
- Flat-rate bias (Lambrecht & Skiera, *Journal of Marketing Research* 2006) shows SMBs pay a premium for bill predictability and are *happier* doing so — the bias survives even professionally trained purchasers (insurance effect, taxi-meter effect, overestimation effect).

Commitment 9 — **bill flat, report outcomes** — is not just doctrine; it is the empirically correct call. The outcome vocabulary belongs in the Morning Briefing, not the invoice.

**Not capabilities.** A capability grid ("voice included, automations excluded") forces the buyer to evaluate features. Job-named packaging lets them self-select by struggle — Intercom's JTBD repackaging under Bob Moesta roughly 3x'd revenue precisely because tiers stopped being feature lists and became answers to "which job am I hiring for?"

**Departments — yes, with one enormous caveat.** The strongest counter-evidence to the whole model: *the recurring SMB packaging failure is selling org-chart packaging to buyers who don't have an org chart.* Salesforce Clouds failed at SMB so badly that Salesforce built the Starter Suite (one SKU, everything pre-bundled) to escape its own architecture. HubSpot collapsed à-la-carte Hubs into one Customer Platform in March 2024. If the pricing page asks a roofer to assemble a company from five departmental SKUs, we repeat that failure.

But the model survives the caveat, for a reason Salesforce's couldn't: **a service business owner does have an org chart — the real-world hiring ladder.** They don't think in "Clouds," but they absolutely think "I need someone to answer the phones," then "I need someone running the schedule and quotes," then "I should be doing marketing but I hate it." Our departments map to hires they already understand and — critically — to *budget lines they already pay*: an answering service ($300–800/mo), an office manager's time, an agency retainer ($2,500–5,000/mo). Salesforce Clouds mapped to an enterprise org chart the SMB didn't have. Our departments map to the SMB's own life.

The discipline required: **few, chunky, customer-recognizable departments on the pricing page** (Front Office, Operations, Growth — three), while the internal taxonomy of nine growth departments and ten employee dossiers stays internal. Choice-overload research is nuanced (the meta-analytic average effect is ~zero), but the moderators that *do* produce overload — unfamiliar buyer, no formed preferences, hard-to-compare options, time pressure — describe this buyer exactly. Three visible options, premium anchor shown first, one marked recommended. 69% of SaaS still runs good-better-best because it works.

---

## The seven questions

### 1. Should Starter contain only the Receptionist?

**Yes — but define it by the completed job, not the headcount.** The evidence for a narrow landing tier is strong: the AI receptionist is the one proven, low-churn, end-to-end AI category for local business, the activation path is short (phone number, hours, services — value in day one), and one employee means one trust relationship for a Draft-Mode-first product. Estimator and Dispatcher carry real onboarding freight — a price book, crew data — which is setup investment an owner only makes when quoting volume is real. That's what makes them a *fair fence*: like Microsoft 365's compliance features, the fence tracks a willingness-to-pay signal (business maturity), so crossing it feels like growing up, not being extorted.

Two challenges to the draft:

- **The Front Office tier must complete its job.** A receptionist who answers but never follows up on the inquiries she took is a crippled job, and Housecall Pro is the cautionary tale for fencing table stakes (gating QuickBooks sync out of Basic is now their dominant negative narrative). "Never lose a lead" — answer, qualify, book, chase its own inquiries — is one job. Fence at the *next* job (quoting, dispatch), never inside the first one.
- **Watch the voice fence.** Live pricing today keeps AI voice out of Starter ($149, chat/SMS only). For a phone-first trade — the leak map opens with "62% of calls missed" — a receptionist without a phone risks reading as punitive rather than premium. Seriously test voice-in-Starter with a tight included-minutes allowance: fence on volume (a maturity signal), not on channel (the job's core organ).

### 2. Should Growth employees live in Scale, or be a separate entitlement?

**Separate — the strongest disagreement with the draft.** Three reasons:

- **Price integrity.** Growth replaces a marketing agency retainer; the umbrella is $2,500–$12,000/mo. ServiceTitan's S-1 shows the working model — Pro add-ons are explicitly priced against *outsourced services* ("the expertise you get from a marketing agency"), not against software tiers, and add 30–50% to the bill while driving 10 straight quarters of >110% net dollar retention. If Growth is just "the stuff included at $699," we've priced an agency replacement at software prices, permanently.
- **The standalone product requires it anyway.** We've already committed to selling Growth alone to Jobber/Housecall/ServiceTitan users. That means Growth must have its own price. If it also lives inside Scale, we have one product with two prices and the arbitrage will embarrass us.
- **Two-axis expansion is the standard architecture** for every durable comp studied: axis one is tier upgrades (capacity/maturity fences), axis two is department add-ons (new jobs). Collapsing both axes into one tier ladder forfeits half the expansion surface.

**The synthesis: the top tier should be the bundle, not a bigger tier.** Jobber just demonstrated the exact move in this market: AI Receptionist at $99 and Marketing Suite at $79 as add-ons, then a Plus tier at $599 where Grow ($349) + both add-ons ($527 combined) makes the bundle arithmetic herd expanding customers upward. Do the same: *Complete Company* = Operations + Growth, priced so that buying them separately costs visibly more. That's also Apple One's real design: the bundle is an attach-rate machine for products the customer wouldn't have bought standalone — and HubSpot's data says bundled customers spend ~3x and retain ~15 points better.

Tradeoff to accept honestly: a separate Growth SKU adds one decision to the page. That's the entire cost, and a "recommended" badge plus the bundle tier absorbs most of it.

### 3. Should Growth OS be visible to customers?

**No. Kill the name at the customer boundary — completely.** Customers hire *the Growth department at TaskBuild*. The evidence: category research shows a second brand creates a second budget line, a second purchase decision, and a second churn decision; the compound-startup data (68% of CIOs consolidating vendors; buyers wanting "fewer logos, fewer logins, fewer renewal conversations") says one-brand platforms win renewals with a portfolio review while point brands defend line items; and the AI-outbound category has a black eye (11x, Artisan's "Stop Hiring Humans" backlash). A standalone "Growth OS" brand walks into that stigma naked. A Growth department inside TaskBuild inherits TaskBuild's trust instead.

Doctrine already ruled this way — A2 (no customer ever sees the v0 UI), "products are wings, never apps," "the Platform never becomes a brand." Extend the ruling one step: *product names are sponsor names in the Employee Registry, nothing more.* Even the tagline should ship customer-facing as "TaskBuild answers the phone — and makes it ring."

**Inconsistency flagged:** the Bridge doc's §6 header still says "one company, **two subscriptions**" — that contradicts Platform D11 (one billing relationship, line items). The Platform doc is right; the Bridge header should be amended.

### 4. Is Front Office → Operations → Growth the right progression story?

**Yes — because it's not our roadmap, it's their hiring ladder.** Winning category language labels an existing struggle (inbound, customer success), and the category name becomes the thing customers budget for. Every service business owner already knows the sequence "first you get someone on the phones, then someone running the office, then you finally do marketing" — and each rung displaces a spend they already recognize (answering service → office admin → agency). We are not teaching a new mental model; we are naming their own.

Two refinements:

- **Make the pricing page an org chart, not a feature matrix.** The single biggest differentiation opportunity on a page every competitor renders as checkmark grids. Show the company they're staffing. "Who's working for you at this level" is a question a roofing contractor answers instantly; "which entitlements illuminate which wings" is a sentence that should never leave the architecture docs.
- **It's a recommended path, not a forced march.** The Growth door must be visibly enterable without the ops tiers (that's the standalone product), the way a real company sometimes hires a marketer before an office manager. Progression story on the page; free traversal in the product.

And rename the tiers. "Starter/Pro/Scale" is commodity SaaS vocabulary that actively fights the metaphor. *Front Office / Operations / Complete Company* does the selling by itself.

### 5. How should expansion revenue work?

**The Event Ledger is a native expansion-trigger engine.** Research says contextual, usage-threshold prompts convert 40–60% versus low single digits for generic upsell banners, and the gate is *realized value* — never prompt before the customer has seen ROI on what they already bought. The architecture generates the receipts automatically. Measurable triggers, mapped to desks:

| Ledger evidence | Staffing proposal |
|---|---|
| Conversation volume nearing the included allowance | Tier upgrade (the non-blocking warn already does this — correct design, keep it) |
| Quote count rising; quotes going stale unanswered | Estimator / Sales Assistant desk |
| Multi-crew scheduling conflicts, manual dispatch events | Dispatcher desk |
| Dormant-customer count × reactivation math ("214 past customers; sequences recover 6–22%") | Growth: Lifecycle |
| Review velocity vs. the named competitor already tracked | Growth: Reputation |
| **Calendar utilization thin next week** | **Growth department — the Demand Thermostat run in reverse** |

That last row is the one to build first, and the Bridge doc already wrote the sales script: *"the day TaskBuild's Wire shows a quiet week is the day the owner asks what a growth department would cost."* The thermostat isn't only a retention feature — it is the expansion salesman. A briefing line that says "next week is 41% booked; a Growth department would be running a reactivation push today" is an upsell with receipts, in the owner's own numbers.

Constitutional constraint: staffing proposals arrive through the Morning Briefing as the Office Manager's recommendation, with dollar evidence, **one at a time, rate-limited, honest under Law 1** — spending from the same one-badge attention budget as everything else. The moment expansion prompts feel like ads inside the briefing, Law 6 is broken along with the trust that makes the prompts convert.

### 6. How should standalone Growth customers experience the HQ?

**Visible, honest, quiet open desks — "not yet hired," never "locked."** Hiding the operations wing forfeits the best asset: Apple's ecosystem math (each added product raises switching costs ~15–20%; the bundle exists to seed products people wouldn't buy standalone) says the *sight* of the rest of the company is the attach engine. The Platform doc already ruled correctly: "a company with some departments not yet hired… is what every real company is."

The design line that keeps it on the right side of "an upsell wearing a mission":

- Open desks appear as an org chart does — a desk, a role, what that hire would do. No padlocks, no grayed-out taunting, no badge count. The vocabulary is *hiring*, never *unlocking* — unlocking is software language and it admits the features already exist behind a paywall; hiring preserves the metaphor and the dignity.
- The ops-lite surface must be genuinely good (the simple pipeline, handoffs to the owner's phone, one-tap "job done?") — the Bridge's "degraded, not crippled" test. A standalone customer who feels punished for not buying the other wing churns out of both.
- Open desks speak only when the ledger gives them standing: "you confirmed 9 bookings by hand this month — this is the Receptionist's job" is a real event, not a nag. Same trigger discipline as Question 5.

### 7. Departments as pricing language, products as architecture?

**Yes — and the platform contracts already voted for it.** The Employee Registry's `sponsor` field *is* this decision rendered in schema: products sponsor desks; customers hire employees into one company; entitlements are the Ground-layer mechanism. Make it official doctrine: **customers buy departments and staffing levels; "TaskBuild OS" and "Growth OS" are sponsor names in the registry and never appear in commerce.**

One guardrail for the future: the *internal* department taxonomy is rich (nine growth departments alone) and must never leak onto the pricing page, or we rebuild Salesforce Clouds one honest step at a time. Customer-facing departments stay at three until a new one passes the SKU test below.

---

## The 2032 test

Pretend it's 2032 and TaskBuild dominates. Does this architecture hold? Mostly — and the places it wouldn't are exactly the places to reinforce now:

1. **"Employee count" will die as a value metric; the org chart won't.** By 2032 an "employee" is an implementation detail — model generations will merge, split, and multiply the agents behind a desk. Any pricing tied to employee headcount becomes either absurd (300 agents!) or a lie. Departments and jobs are the durable abstractions. This is the deepest reason the department instinct is right and employee-listing tier cards are a trap: **sell the staffed department, never the number of robots in it.**
2. **The agency umbrella will compress.** Growth prices under a $2,500–5,000/mo retainer today; by 2032, AI-department competitors will have repriced that labor at machine rates (the credible critique of Sequoia's "capture labor budgets" thesis: when machines do the work, the work gets repriced). Pricing power must migrate from "cheaper than the agency" to **the Core** — the memory moat, the compounding track records, the entity graph nobody can export. That's Apple's actual lesson: integration reduces price sensitivity. The architecture already supports this; never let the marketing lean solely on the discount-vs-agency pitch.
3. **New departments need a SKU test, or we get Clouds sprawl.** Ratify now: *a department becomes a purchasable SKU only when it displaces a budget line the customer already pays someone for* (Growth → agency retainer; a future Finance department → the bookkeeper; a future HR desk → nothing yet, so it lands inside an existing tier). Departments without an existing budget line ship into Complete Company first, Apple One-style, and earn their SKU later.
4. **A third revenue axis is waiting: payments.** ServiceTitan's quiet 25% of revenue is usage-based FinTech take-rate — outcome-*aligned* revenue without outcome-*billing* psychology. When the Estimator sends quotes and the platform collects deposits, a payments take-rate scales with customer success while the subscription stays flat. Design the billing layer to accommodate it; don't ship it yet.
5. **The capacity scalar needs a decision.** Flat tiers need an included-usage unit that grows as the customer grows (the comps converge on this: seats, technicians). Ours is conversations today — workable, but revisit whether "managed jobs" is the truer unit once Estimator/Dispatcher volume dominates. Never per-seat: AI shrinks seats, so seat pricing punishes success (Emergence's point, and HubSpot's arc confirms the platform-not-module identity matters more than the meter).

Verdict: the architecture is not redesigned in 2032. The *guardrails around its growth* are designed today — the SKU test, the one-brand rule, and the scalar decision.

---

## The recommended architecture

**One brand. One page. Three tiers named as staffing levels, one department add-on, one bundle.** Illustrative numbers to be tested, anchored to displaced spend:

| You hire | What's staffed | Anchor it displaces | Illustrative price |
|---|---|---|---|
| **Front Office** | Receptionist — the complete "never lose a lead" job (incl. following its own inquiries; test voice with capped minutes) | Answering service $300–800/mo | ~$149–199/mo |
| **Operations** ★ recommended | + Estimator, Dispatcher, **Sales Assistant**, Office Manager — "no quote dies of silence, no schedule collides" | Office admin time; Jobber Grow-tier spend | ~$399–499/mo |
| **Complete Company** | Operations + the entire Growth department, one briefing, one bill | The whole stack: FSM + answering + agency + reputation ($3k–6.5k/mo) | Priced so separates cost ~15–20% more |
| **Growth Department** (add-on to any tier, or standalone — the Jobber/HCP/ServiceTitan door) | Lifecycle + Reputation now; SEO/Content, then Outbound light up as generations ship — same price story: "your department gets bigger" | Agency retainer $2,500–5,000/mo | ~$499–799/mo flat |

Mechanics that make it compound:

- Capacity allowances with non-blocking overage prompts (already built).
- Ledger-driven staffing proposals in the Morning Briefing, with the Demand Thermostat as the flagship Growth trigger.
- Open desks visible everywhere as future hires.
- Bundle decoy math on the pricing page.
- **Bill flat, report outcomes, never salary-anchor the headline** — Commitments 9 and 10, now with ~90 external citations behind them.

### Validate before ratifying

1. **The voice-in-Front-Office question** against live conversation data — the one fence where doctrine and current pricing disagree.
2. **Growth's standalone price** against 10–15 real Jobber/Housecall users (the least-anchored number here).
3. **Tier-name comprehension** the cheap way — say "Front Office, Operations, or the Complete Company" to five contractors and watch whether anyone asks what you mean.

---

## Key research citations

**Suite/platform packaging:** Microsoft Office bundle history (eWEEK, Commoncog); HubSpot March 2024 Customer Platform repricing + Q1 2026 multi-Hub data (12% single-Hub ARR, bundled customers ~3x spend); Salesforce Essentials failure → Starter Suite 2023 / Pro Suite 2024 (SMB Group); ServiceTitan S-1 (Pro add-ons priced vs outsourced services, NDR >110%, ~25% usage revenue); Jobber Plus decoy math (AI Receptionist $99 + Marketing Suite $79 vs Plus $599); Housecall Pro add-on-trap backlash; Atlassian PLG (~15% S&M spend vs 50–100% median).

**AI pricing:** 11x salary-anchored failure (TechCrunch Mar 2025, 70–80% churn); Artisan backlash; Sierra/Decagon/Intercom Fin outcome pricing + bill shocks; Salesforce Agentforce three pricing models in 18 months; HubSpot Breeze April 2026 pay-per-result; SMB receptionist flat-rate band $149–299/mo; Bessemer (hybrid = 41% of AI vendors); Sequoia pricing maturity curve + labor-repricing critique; Medina/Poyar four-model framework; Emergence autonomy×attribution 2x2.

**Psychology & packaging theory:** Lambrecht & Skiera 2006 (flat-rate bias); Gourville 1998 (pennies-a-day); Iyengar & Lepper 2000 + Scheibehenne 2010 meta-analysis (choice-overload moderators); Ariely Economist decoy; Rafi Mohammed HBR good-better-best (fences); OpenView 104-company study (69% G-B-B; leaders/fillers/killers); Simon-Kucher rise-and-fall of G-B-B; Poyar "unbundle then rebundle"; Intercom JTBD repackaging (~3x revenue); Play Bigger / HubSpot inbound / Gainsight customer success / Drift's failed "revenue acceleration" (category names must label an existing struggle and become the budget line); Apple One attach-rate bundling + ecosystem switching costs (~15–20% per added product); compound-startup consolidation (68% of CIOs); Phase 5 SMB research (owner decides ~80% of the time; pricing page clarity decisive).

---

> **The one-sentence version:** we're not selling software tiers, and we're not selling robots — we're selling the next hire the owner already knows they need, from a company that can prove, from its own ledger, why now.

*CPO/CRO STRATEGY MEMO · PRE-RATIFICATION CHALLENGE · JULY 2026*
