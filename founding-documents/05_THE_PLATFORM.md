# The Platform
## One company. The architecture beneath the ecosystem.
**Version 1.0 — July 2026 · Chief Systems Architect review**

*The Founding Documents (generation one) established what TaskBuild OS and Growth OS are. This document establishes what stands under both — and under every product that comes after. It contains four things: an honest audit of where generation one accidentally designed two companies, the design of the shared platform, the residency rules for AI employees, and the 2035 debt review with the migration path. No vision is added here. Every principle in the Constitution is preserved; this is the load-bearing structure that keeps those principles true at scale.*

> **The prime directive: products share intelligence, not integrations.**
> Two products that integrate are two companies with a phone line between them. Two products that read and write one Core are one company with two departments. Every architectural decision below is that sentence, enforced.

---

# Part I — The Audit

## What generation one accidentally built

The Founding Documents *say* one company. The v0 reality — and in places, the documents themselves — quietly designed two. Each finding below names where, and what the platform must make impossible.

### Finding 1 — Two databases pretending to be one Record
The Bridge declares: *"no sync, no integration, no export — architecture, not partnership."* Reality: TaskBuild OS runs its own Postgres (orgs, conversations, jobs, estimates, role engine) and Growth OS runs another (leads, sequences, bookings, customers, metrics). The same human being exists in both as different rows, **joined by email string matching** (`lib/match.ts`; bookings and Stripe customers matched by email). Email-joins are the architecture equivalent of a handshake in the dark: people have multiple emails, shared emails, changed emails. *The moment a reactivated customer books a job, we currently learn about it by luck.*
**Verdict:** the single worst debt in the ecosystem. The Record must become one physical source of truth with real entity resolution — before any customer touches Growth OS.

### Finding 2 — Two identities, two permission systems
TaskBuild has orgs, users, sessions, per-org entitlements, and a role engine. Growth OS has its own single-founder login (`lib/auth.ts`) and a key/value settings table. If Phase 1 shipped tomorrow, a customer would have two accounts, two logins, and two places where "who can do what" is decided.
**Verdict:** Identity and permissions are platform layer zero. Growth OS must never grow its own tenancy — it inherits the org.

### Finding 3 — Two memories
TaskBuild's memory is the Company Record / The Core. Growth OS v0 grew a proto-memory of its own: `metrics_daily`, `cmo_reports`, `settings`, per-lead score reasons. Two accumulating intelligences that don't read each other — precisely the thing Law 3 exists to prevent. The Estimator will never price smarter because the Researcher learned which neighborhoods convert, unless both write to one Core.
**Verdict:** one Memory, namespaced by employee, readable by all (contract below).

### Finding 4 — Two headquarters
The TaskBuild Manifesto builds the HQ: Floor, Wire, Door, Corner Office, Morning Briefing. The Growth OS Manifesto (§04) then quietly builds a second one: "the Briefing, the Queue, the Handoff." The Queue **is** the Door. The growth briefing **is** a section of the Morning Briefing. `02_THE_DEPARTMENTS.md` even has the two chiefs of staff "briefing the owner side by side" — which is two morning meetings wearing one trench coat.
**Verdict:** there is one building. Products are wings, not addresses. Amendment A1 below.

### Finding 5 — Duplicated employees (four near-misses, one real collision)
- **Reputation Manager** — sketched in TaskBuild Phase 3, fully drawn in Growth OS. The Bridge already ruled "one employee, both wings" — correct, but nothing *enforces* it. Without a registry, two teams ship two of them.
- **Marketing Manager (TaskBuild Phase 3)** — the Bridge correctly retired this desk into Growth OS. Enforced nowhere.
- **Sales Assistant vs. Lifecycle Marketer** — the boundary (active pipeline vs. closed book) is written in prose. Prose does not stop a double-text at 8 AM. Contact ownership must be *state*, not literature.
- **Customer Success vs. Lifecycle** — currently safe (signals flow one way) but only by authorial discipline.
- **The real collision: Growth Analyst vs. Business Advisor.** Both are defined as "reads everything, advises the owner." Two number-people who both answer "how's the business?" is how the owner ends up with two dashboards and one headache.
**Verdict:** employees become org-scoped singletons in a platform registry (Part III), and the Analyst/Advisor pair gets an explicit reporting line.

### Finding 6 — Duplicated workflows
Three employees draft-and-send sequenced outreach: the Sales Assistant (pipeline follow-up), the Outbound SDR (cold sequences), the Lifecycle Marketer (campaigns). In v0 each would carry its own sending code, consent handling, opt-out list, and touch history. Three copies of the single most dangerous capability in the company — the one with TCPA damages and domain reputation attached.
**Verdict:** one Outreach Engine, one consent ledger, one touch history. Employees *use* it; none *own* it.

### Finding 7 — Duplicated reporting, notifications, settings, billing
- Weekly CMO report (Growth OS) vs. Office Manager week-in-review vs. Business Advisor P&L narrative: three reporting engines for one owner.
- The booking SMS alert (TaskBuild) is a hand-built point feature; Growth OS would inevitably build its own "text the owner" path. Two roads to the owner's attention means the one-badge law (Law 6) is already broken.
- Two settings stores, and — as products — two Stripe subscriptions for one customer.
**Verdict:** Reporting, Notification, Settings, and Billing are engines, built once (Part II).

### Finding 8 — The quiet vendor and scheduler debt
Growth OS v0 hard-wires vendors as modules (`apify.ts`, `cal.ts`, `stripe.ts`, `gsc.ts`, `mailer.ts`) and runs on a daily cron. Law 7 says vendor vocabulary never reaches the customer; the architecture version is that vendor shape should never reach the *employee* either. And Law 5's own manifesto warns about "cron jobs in trench coats" — a scheduler is a crutch where an event should be a trigger.
**Verdict:** capability interfaces (Integrations) and an event-driven Trigger Engine, with schedules as one trigger type among many.

*None of these findings are failures of the vision. They are what always happens when two products are drafted faster than their foundation — which is why this document exists now, while the debt is measured in weeks instead of years.*

---

# Part II — The Platform

The invisible foundation. It has no brand name, no customer-facing presence, and no personality — Core Law 3 applies to infrastructure doubly. Internally we call it **the Platform**; the customer only ever experiences it as *the company working*.

Think of it as the parts of a real headquarters no department owns because every department needs them: the deed, the ledger, the filing room, the payroll office, the building itself.

```
┌─────────────────────────────────────────────────────────────┐
│  THE BUILDING — one HQ: Floor · Wire · Door · Corner Office  │
│  (products appear here as wings, never as apps)              │
├─────────────────────────────────────────────────────────────┤
│  THE ENGINES — how work happens                              │
│  Employee Registry · Relay/Workflow · Approval · Autonomy    │
│  Trigger · Outreach · Notification · Briefing/Reporting      │
│  AI Model Routing · Integrations                             │
├─────────────────────────────────────────────────────────────┤
│  THE CORE — what the company knows                           │
│  Event Ledger · Entities · Knowledge · Memory · Decisions    │
│  Search (one query surface over all five)                    │
├─────────────────────────────────────────────────────────────┤
│  THE GROUND — identity & trust                               │
│  Identity/Org · Entitlements · Billing · Secrets · Audit     │
└─────────────────────────────────────────────────────────────┘
```

## Layer 0 — The Ground (identity & trust)

- **Identity.** One organization, one owner account, optional staff accounts. Every product, employee, and record hangs off the org. Growth OS never has its own login again.
- **Entitlements.** The generalization of TaskBuild's per-org gating: *what has this company hired?* Products are entitlement bundles; employees and capabilities are entitlement-gated. (The hard lesson already learned in production — an unrecognized plan slug silently degrading employees — becomes impossible when entitlements are a first-class platform contract instead of per-product plan-string parsing.)
- **Billing.** One customer, one wallet, one invoice with line items ("Operations wing · Growth wing"). Hiring a new product is adding a line, never creating a second billing relationship. Flat pricing, outcome reporting — the Research Foundation's commandment, enforced structurally.
- **Secrets.** One vault for org credentials (telephony numbers, GBP access, ad accounts, sending domains). An employee requests a *capability*; the vault maps it to a credential. No employee, product, or prompt ever holds a raw secret.
- **Audit Log.** Distinct from the company ledger: this is the *forensic* record — who (human or employee) did what, under which permission, when. The ledger tells the company's story; the audit log defends it. Approvals, autonomy promotions, sends, and money movements always land in both.

## Layer 1 — The Core (what the company knows)

The Constitution already named this layer (`06_THE_CORE.md`): *"the Company Record made visible."* The audit's contribution is completing its anatomy. The Core is **five stores and one contract**, not one table:

1. **The Event Ledger** — append-only, attributed, immutable: everything that *happened*. Calls answered, drafts written, jobs closed, reviews earned, sends delivered, batons passed. The Wire is this ledger rendered; the Event Bus is this ledger's live edge (employees subscribe to it; the Trigger Engine fires from it). One schema, one clock, one order.
2. **The Entities** — the *nouns* the events happen to: **contacts** (with the ownership membrane as a real field — which employee currently works this person, transferable only by logged baton-pass), businesses, jobs, estimates, conversations, campaigns, prospects. Entity resolution lives here: one human = one contact, however many emails, phones, and profiles they carry. This is the fix for Finding 1, and it is the platform's most safety-critical duty — the membrane in the Bridge stops being prose and becomes a constraint the Outreach Engine physically cannot violate.
3. **The Knowledge** — the *curated truths* that aren't events: the price book, service areas, brand voice, business hours, policies, the owner's answers from onboarding-as-interview. Versioned, owner-correctable, provenance-tracked. (Events are what happened; knowledge is what's true.)
4. **The Memory** — the *derived learnings*: "this customer prefers texts," "sequence B out-converts A for HVAC," "crew B's flashing details cause callbacks," "Maple Grove converts at 2x." Namespaced by the employee that learned it, **readable by every employee**, versioned and correctable — because unlike the ledger, memory can be *wrong*, and a memory that can't be corrected becomes a superstition the whole company inherits.
5. **The Decisions** — the missing store the audit found. Every recommendation an employee makes, the owner's verdict, and the eventual outcome. This is what powers track records (Law 4's autonomy ladder is *computed from this store*, not from a settings toggle), the "recommendation adoption rate" KPIs both manifestos promised, and the constitutional requirement that "why didn't we build X?" always has a written answer — extended to "why didn't we run that campaign?"

**Search** spans all five stores as one query surface. The Corner Office is Search wearing the employee metaphor: "did we ever quote the Hendersons?" is one query across entities, events, and knowledge — answered by the right employee, in their voice, from the same index.

**The Core contract** (the part that makes it *operating intelligence* rather than storage — Part IV expands this):
- Every employee **reads before acting** and **writes after acting**. Not convention — enforced: an employee action that cites no read context and produces no ledger event doesn't ship. This is Law 3 made mechanical.
- Nothing customer-visible may claim what these stores cannot prove (Core Law 2, now checkable in code review).

## Layer 2 — The Engines (how work happens)

Built once, owned by no product, used by every employee.

- **Employee Registry.** The generalization of TaskBuild's role engine, promoted to the platform: an employee is org-scoped config — slug, mission, persona, granted capabilities, channels, autonomy state, memory namespace. **The registry enforces singularity: one slug, one employee, per company.** Products don't ship employees; they *sponsor desks* in the registry (Part III). Hire/fire lifecycle, per-employee entitlements, and the tool registry all live here.
- **Relay Engine.** Baton passes as data: the handoff graph (who hands what to whom), each edge carrying its SLA (the 4-hour signal rule, the minutes-not-hours warm-reply rule, the same-day review-ask rule). Relays emit ledger events ("Estimator picked up booking #118 from Receptionist"), and SLA breaches surface through the Office Manager — honestly, per Law 1. The Demand Thermostat is not a feature: it is one relay (Dispatcher capacity event → Growth Director proposal) running on this engine.
- **Approval Engine.** One Door. Every draft from every employee in every product enters the same queue with the same anatomy: who's asking, what they'll do, what happens if ignored, and expiry semantics. The whole ecosystem's badge count. Batch review (the 200-drafts-an-hour pattern) is a Door capability, not an outreach feature.
- **Autonomy Engine.** Draft → Approve → Auto as a computed state per employee *per play*, derived from the Decision store ("47 of 48 approved unchanged"). Promotions are proposed by the employee, granted by the owner, revocable instantly, and recorded in both ledger and audit log. Hard floors (money, pricing, complaints, ad spend, negative reviews) are platform constants no product can override.
- **Trigger Engine.** Events first, schedules second. "Job completed + sentiment happy" is a subscription, not a nightly scan. Cron survives only for genuinely calendar-shaped work (seasonal campaigns, weekly reviews) — and even those fire as events into the same bus, so every piece of work in the company starts with a ledger entry that says *why*.
- **Outreach Engine.** The single most regulated capability, built exactly once: sequences, sending, per-contact touch history, the consent/opt-out ledger, channel compliance as hard floors (authenticated domains + warm-up ramps for email; 10DLC gating for SMS; manual-assist-only for LinkedIn), complaint-rate circuit breakers that halt sending *themselves*. The Sales Assistant, SDR, and Lifecycle Marketer are three *users* of one engine — which is what makes the double-text structurally impossible: the engine refuses a touch to a contact whose membrane says another employee owns the conversation.
- **Notification Engine.** One attention budget for the owner, ecosystem-wide: one badge (the Door), one briefing (below), and one escalation channel (the SMS alert generalized: *any* employee's genuine emergency reaches the owner's phone through the same gate, rate-limited, amber-only). Law 6's "new demands for attention must displace something" becomes an enforced invariant because there is exactly one place demands can enter.
- **Briefing & Reporting Engine.** One Morning Briefing, compiled by the Office Manager, with sections contributed by department heads — the Growth Director's weekly review is a *section*, the Business Advisor's monthly narrative is a *section*. One Company Timeline (the Wire) with department filters. One reporting vocabulary (outcomes, dollars, real events — never activity theater), rendered per-audience the way elite RevOps runs daily/weekly/monthly tiers.
- **AI Model Routing.** Models are commodities; the Core is not. Routing is a platform table — task shape → model tier, latency budgets per channel (the voice-webhook lesson already paid for in production), cost ceilings per org, fallbacks on failure. No employee, prompt, or product names a model vendor. Ten years of model churn should replace rows in this table and nothing else.
- **Integrations.** Capability interfaces, not vendor modules: *telephony, calendar, email-send, sms-send, payments, reviews, search-visibility, ads, web-research*. Vendors implement capabilities; employees request capabilities; the Secrets vault supplies credentials. Swapping Apify, Cal.com, or an SMTP relay is a driver change, invisible above this line. (Law 7's "plumbing problems re-expressed as employee needs" — architecturally guaranteed.)

## Layer 3 — The Building (one HQ)

The answer to "which app do I open?" is: **there are no apps.** There is the company.

- One login. One shell. The four rooms of the TaskBuild Manifesto *are* the product surface of the entire ecosystem: the **Floor** shows every hired employee regardless of sponsoring product; the **Wire** is the one timeline; the **Door** is the one queue; the **Corner Office** talks to the whole company.
- **Products are wings.** Buying Growth OS when you own TaskBuild is not installing an app — it's the east wing lighting up: new desks appear on the Floor, new sections appear in the briefing, new events flow through the same Wire. Same building, more lights on.
- **Standalone is the same building, honestly furnished.** A Growth-OS-only customer walks into the same HQ with the growth desks staffed and a modest ops surface (the Entities layer's default pipeline view; handoffs go to the owner's phone; "job done?" is a one-tap signal instead of a Dispatcher event). A TaskBuild-only customer sees exactly today's product. Neither is crippled — each is a company with some departments not yet hired, which is what every real company is. The upgrade moment stays organic, as the Bridge requires.
- **The v0 Growth OS UI is scaffolding, and scaffolding comes down.** It exists for customer zero and prototype work. No paying customer ever sees it; Phase 1 ships inside the HQ. (This is ratified as Amendment A2.)

---

# Part III — Employee Residency

**The rule: employees are citizens of the company, employed by nobody but the owner.** Products sponsor desks; the Registry guarantees one employee per desk per company; the Core guarantees one memory. The owner can never have two Reputation Managers for the same reason a building can't have two front doors named "front door."

How one employee works across products without duplication:

1. **One identity in the Registry** (org-scoped slug: `reputation-manager`), whichever product sponsored the hire.
2. **Capabilities accrue with entitlements.** Own only TaskBuild → the desk may not exist yet (Phase 3) or exists with its ops duties. Add Growth OS → the *same employee* gains the growth duties, keeps the same memory, the same track record, the same voice. The owner experiences a colleague taking on more responsibility — never a new hire with the same name.
3. **One memory namespace, company-readable.** What the Reputation Manager learned about which crews earn stars is readable by the Quality Inspector *and* the Content Writer, because memory belongs to the Core, not the product.
4. **One track record.** Autonomy earned answering positive reviews doesn't reset because a different product sponsored the capability. Trust accrues to the employee (Law 4), and the Autonomy Engine holds it centrally.

**The challenged employees, ruled on:**

| Employee | Ruling |
|---|---|
| **Reputation Manager** | Exists once. Timed by operations (TaskBuild signals), employed in growth (Growth OS duties). The canonical cross-product citizen. |
| **Content Writer** | Exists once. Writes the company's voice everywhere — job stories and service pages (growth) and, eventually, customer-facing templates (ops). One brand-voice memory is the entire point; two writers would drift into two voices. |
| **Customer Success** | Exists once, in operations. Growth employees *subscribe to its events* (delight → review ask, referral moment); they never talk to its customers. No growth twin, ever. |
| **Growth Analyst & Business Advisor** | Both exist — they are different jobs (a marketing analyst is not a CFO) — but with an explicit line: the **Analyst owns growth attribution and funnel truth; the Advisor owns whole-company judgment and consumes the Analyst's numbers.** The Corner Office routes questions so the owner never chooses between them: "did Facebook make money?" → Analyst; "should I buy the second crane?" → Advisor. One ledger beneath both, so their numbers can never disagree — the only truly fatal failure mode for two number-people. |
| **Office Manager** | **The single chief of staff of the entire company.** There is one Morning Briefing and it has one compiler. The Growth Director is a *department head* who contributes the growth section and runs the growth wing's internal cadence — a peer of the Dispatcher in the org chart, not a second Office Manager. (Amendment A1 corrects the "side by side" phrasing.) |
| **Sales Assistant & Lifecycle Marketer** | Both exist; the membrane between them is now *state* (contact ownership in the Entities store) enforced by the Outreach Engine, with transfers as logged baton passes. The written boundary stays as the human-readable law; the engine is why it can't be broken at 8 AM by two well-meaning drafts. |
| **Growth Director** | Exists once, in Growth OS. Its "thermostat" behavior is a Relay subscription to TaskBuild capacity events — shared intelligence, not a cross-product API call. |

---

# Part IV — The Core, challenged and answered

**Is The Core simply memory?** No — and the Constitution already knew it: *"the reason the Estimator can price from what the Receptionist heard."* That's not storage; that's circulation. The audit's completed answer:

> **The Core is the operating intelligence of the company: five stores (Ledger, Entities, Knowledge, Memory, Decisions) bound by one contract (read before acting, write after acting) and one index (Search).** Memory is one of its five organs. The contract is its pulse.

**Should every employee read from it?** Mandatory, and mechanical: an employee action that cites no context from the Core is a bug with a Law 3 label on it. **Contribute to it?** Equally mandatory: work that leaves no ledger event didn't happen (and can't appear in a briefing, per Core Law 2).

**Should future products automatically inherit it?** This is the deepest architectural consequence in the ecosystem: **a new product is new desks reading an old memory.** The day a future product's employee is hired, it already knows every customer, every job, every price, every learned preference the company ever recorded. Inheritance isn't a feature of the product — it's a property of the Registry + Core architecture. This is what "share intelligence, not integrations" buys: the third product costs a fraction of the second, and the tenth costs a fraction of the third.

**How The Core evolves over the decade** (capability stages, not vision — each is an architectural consequence of the stores existing):

1. **Now — the shared ledger.** One Record, entity resolution, the read/write contract. (The work of Part VI.)
2. **Next — circulation.** Cross-employee learning becomes routine: pricing wisdom informs offers, callback patterns inform review timing, conversion geography informs prospecting. No new machinery — this is what namespaced-but-readable Memory does once both wings write to it.
3. **Then — judgment with receipts.** The Decisions store matures into the company's decision history: every recommendation carries its own track record, every "should we?" is answered with "last four times we did, here's what happened." The Autonomy Engine and the Business Advisor are both consumers of this one store.
4. **Later — vertical priors.** The Manifesto's Phase-4 "vertical packs" land here architecturally: anonymized, opt-in, cross-company norms per trade ("roofing companies your size see 31% margins on tear-offs in March") — priors a new company's Core starts with, never data any company leaks. This must be designed as an explicit consent boundary in the schema *now*, because retrofitting privacy boundaries into a shared-learning system is how platforms end up in the news.
5. **Always — model-independent.** The Core outlives every model that reads it. AI Model Routing exists so that a decade of LLM churn replaces rows in a table while the company's accumulated intelligence — the actual moat (Law 3) — never moves. The Core is the asset; models are the staff that consult it.

And permanently: Core Laws 1–3 hold. The Core stays discovered-never-explained, claims only what its rows prove, and remains infrastructure with gravity — not a character. The Platform never becomes a brand.

---

# Part V — 2035: the debt register

*Reviewed as if hundreds of thousands of companies run on this. Every item: the decision made today, why it breaks at scale, and the fix.*

| # | Today's decision | How it breaks by 2035 | The fix, and when |
|---|---|---|---|
| D1 | Email-string matching joins people across tables | Mis-merged humans at scale = wrong-person texts, broken trust, legal exposure. The single scariest line item. | Entity resolution in the Entities store. **Before any Growth OS customer.** |
| D2 | Two databases, two schemas | Every year of divergence multiplies migration cost; "one Record" becomes marketing fiction | One platform datastore; products own domain tables *inside* it, never parallel universes. **Phase 1 is the forcing function** (Lifecycle/Reputation need TaskBuild's customer data on day one). |
| D3 | Growth OS is single-tenant with its own login | Retrofitting tenancy onto a founder tool produces a second identity system forever | Growth OS customer features are **built on TaskBuild's org/role infrastructure from the first line**. The v0 repo is never multi-tenanted. **Ratified now** (Amendment A2). |
| D4 | Products tempted to call each other's APIs | Point-to-point coupling: N products = N² integrations, the exact Apple-ecosystem failure the vision forbids | The prime directive as a build rule: **no product imports another product's schema or calls its endpoints. Ever.** Events in, Record out. **Standing law from today.** |
| D5 | Nightly cron as the work scheduler | "Company works while you sleep" degrades to "company works at 3 AM in batches"; triggered moments (review asks at the emotional peak) miss their half-life | Trigger Engine on the Event Bus; cron demoted to calendar-shaped work only. **Phase 1–2.** |
| D6 | Vendors hard-wired as modules (`apify.ts`, `cal.ts`, `mailer.ts`…) | Every vendor deprecation is surgery across employees; vendor shape leaks into prompts and UX | Capability interfaces + Secrets vault (Layer 2). **As each capability is touched — no big-bang rewrite.** |
| D7 | Outreach logic per-employee | Three consent ledgers drift; one missed opt-out at scale = uncapped TCPA class action | One Outreach Engine, one consent/touch ledger, circuit breakers. **Before Phase 3 (productized outbound), no exceptions.** |
| D8 | Autonomy as per-product settings | Trust can't migrate; the "47 of 48" moment can't be computed; Law 4 degrades into the toggle it banned | Decisions store + Autonomy Engine from Phase 1. Track records are *data*, born now. |
| D9 | Notifications as point features (booking SMS) | Ten products × three alert paths = the owner mutes everything; Law 6 dies by a thousand pings | Notification Engine with the one-badge budget. **Phase 1.** |
| D10 | Model choices embedded in code | Model churn (already: per-channel latency fixes in production) becomes permanent maintenance | AI Model Routing table. **Phase 1, cheap now, priceless later.** |
| D11 | Two settings stores, two Stripe relationships | Customers with two invoices for one company; support burden; bundle pricing impossible | Ground-layer Billing + Org Settings. **Before Growth OS charges its first dollar.** |
| D12 | Cross-company learning unplanned | Vertical packs get bolted on later and leak data, or never ship | Consent boundary in the Core schema **now**; the capability itself waits for Phase 4+. |

**The migration doctrine — strangler, never big-bang:**

1. **Now (before Phase 1):** ratify the contracts as specs — the event schema, the contact entity + membrane, the Employee Registry shape, the capability interfaces. Paper is cheap; divergence is not.
2. **Phase 1 builds ON the platform, not beside it.** Lifecycle and Reputation ship as employees in TaskBuild's existing infrastructure (orgs, role engine, per-org gating — already live in production), writing to the unified Record from their first event. Growth OS's first customer-facing phase is thereby also the platform's first proof.
3. **The v0 Growth OS repo becomes what it truly is: customer zero's lab.** It keeps growing TaskBuild and prototyping plays; its proven engines (scoring, sequences, GSC ingestion, the CMO report) are *ported into the platform* as they graduate, and the scaffolding is eventually thanked and dismantled.
4. **Nothing merges for merging's sake.** A migration that doesn't unblock a phase or retire a debt line waits. Elegance is measured in debts retired per quarter, not diagrams.

---

# Part VI — The rules for every future product

The test a third product must pass before its first line of code — the Decision Filter's architectural twin:

1. **It sponsors desks in the Registry; it ships no employees of its own.** If its "new employee" already exists, it grants capabilities to the existing citizen.
2. **It reads the Core and writes the Ledger from its first event.** If it needs a private database of company truth, it has misunderstood the building.
3. **It calls no product and is called by none.** Events in, Record out, engines for everything shared.
4. **It appears as a wing in the one HQ.** If it needs its own login, its own briefing, or its own badge, it is a separate company and should be spun off, not shipped.
5. **It inherits identity, entitlements, billing, secrets, notifications, and approvals from the Ground and the Engines.** Building any of these itself is the reject condition.
6. **It must be excellent alone** — a company with some departments unstaffed, never a demo of the bundle — **and exponentially better together**, because on day one its desks already remember everything.

---

## Amendments proposed to generation one

*Per the process in `04_VISION_CHANGELOG.md` — small, precise, with evidence from the audit. The Growth OS documents are amended directly (they are this repo's, ratified today); the TaskBuild document change is proposed for the founder's approval, per the standing rule.*

- **A1 (Growth OS `02_THE_DEPARTMENTS.md`, `04_THE_BRIDGE.md`):** strike the image of the Office Manager and Growth Director briefing "side by side." There is one Morning Briefing, compiled by the Office Manager; the Growth Director contributes its section as a department head. One building, one morning meeting.
- **A2 (Growth OS, ratified):** the v0 UI is customer zero's scaffolding; Growth OS customer experiences ship only inside the one HQ, built on the platform's identity/org layer. The v0 repo is never multi-tenanted.
- **A3 (Growth OS `01_GROWTH_OS_MANIFESTO.md` §04):** rename the owner surfaces to their true names — the Queue *is* the Door; the growth briefing *is* a section of the Morning Briefing. The Handoff stays, as a relay.
- **A4 (proposal to TaskBuild `01_PRODUCT_MANIFESTO.md`):** annotate the Phase-3 "AI Marketing Manager" and "AI Reputation Manager" entries as desks that stand in the Growth wing (per the Bridge), so the two org charts can never be read as parallel hires.

---

> **We are not building products that talk to each other. We are building a company whose departments were never separate.**
>
> Every product stands alone as a business with some desks empty. Together they are one headquarters, one workforce, one memory, one Core — and the third product, whatever it is, will be hired into a company that already knows everything.

*THE PLATFORM · ECOSYSTEM ARCHITECTURE · v1.0 · GOVERNED BY THE SEVEN LAWS, AUDITED AGAINST THEM*
