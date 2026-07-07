# Generation One Ratification
## The official record of what is now settled law
**Version 1.0 — Ratified by the Founder, July 7, 2026**

*This document closes the design era and opens the execution era. Generation One — the Constitution (app repo), the Growth OS founding documents (00–05), the platform contracts (app repo `platform/contracts/`), and the pricing architecture challenged and validated in `PRICING_PACKAGING_CPO_MEMO.md` — is hereby ratified. Everything below is settled law. It may be amended only by real customer evidence, never by taste, fashion, or a fresh redesign impulse. From this commit forward, the work is shipping.*

---

# I — The Platform, ratified

TaskBuild is **one company**.

- **One app. One headquarters.** Floor, Wire, Door, Corner Office. The customer never wonders which app to open; the answer is always the same building.
- **One Company Record. One Core** — five stores (Ledger, Entities, Knowledge, Memory, Decisions), one contract (read before acting, write after acting), one Search.
- **One Employee Registry.** Employees are org-scoped singletons — citizens of the company, employed by nobody but the owner.
- **One Door.** Every draft from every employee enters one approval queue.
- **One Morning Briefing**, compiled by the Office Manager; department heads contribute sections.
- **One billing relationship.** One customer, one wallet, one invoice with department line items. (The Bridge §6 header "two subscriptions" is superseded by Platform D11 — noted for amendment.)
- **Products are architectural concepts.** They sponsor desks in the Registry; they never appear in commerce, never own an app, never own a login. Growth OS remains an internal product name — never a customer-facing application or brand.

**Prime directive, standing:** products share intelligence, not integrations. No product imports another product's schema or calls its endpoints. Ever.

---

# II — The Commercial Doctrine, ratified

## What customers buy

Customers do **not** purchase features, AI employees, AI seats, outcomes, or software modules.

**Customers hire departments** that solve business problems they already recognize — named in the hiring ladder of a real service business, each displacing a spend they already carry.

- **Departments are the commercial offering.** They own business outcomes.
- **Employees are the user experience.** They perform the work. They are never pricing units, never SKUs.
- **Products sponsor departments** inside the platform, invisibly.
- **The Core provides shared intelligence; the Company Record provides shared memory** — the reason the whole is worth more than the parts, and the moat pricing power migrates to over time.

## Generation One pricing (the working baseline)

| You hire | Price |
|---|---|
| **Front Office** | **$199/month** |
| **Operations** | **$499/month** |
| **Growth Department** (add-on to any tier, or standalone) | **$599/month** |
| **Complete Company** (Operations + Growth bundle) | **$899/month** |

**Final validation, performed against the full research base before ratification:**

- **Ladder geometry is sound.** $199 → $499 → $899: the top tier sits 80% above the middle (HBR good-better-best guidance: 40–100%); the bundle saves $199 vs. $1,098 bought separately — separates cost 22% more, comfortably inside the decoy range that herds expanding customers upward (the Jobber Plus pattern).
- **Every price sits under its displaced anchor.** Front Office $199 vs. answering services at $300–800/mo (and inside the $149–299 flat-rate AI band). Operations $499 vs. FSM software *plus* the admin labor it staffs. Growth $599 vs. agency retainers at $2,500–5,000/mo. Complete Company $899 vs. the contractor's existing $3,000–6,500/mo stack — the whole company for a seventh of the spend it replaces.
- **No materially stronger structure was found.** Per-employee pricing (11x's 70–80% churn), outcome billing (SMB flat-rate bias; Salesforce's three public repricings), and feature-grid tiers were all re-examined and re-rejected on the evidence.

Three execution notes carried into the roadmap, not blocking ratification:

1. **Front Office should include voice with a capped minutes allowance.** A phone-first trade buying a receptionist without a phone is a crippled job (the Housecall Pro table-stakes-fence lesson); the cap is the fair fence, and it justifies the +$50 over the legacy Starter.
2. **$599 Growth is the least externally anchored number** (Phase 1 scope is Lifecycle + Reputation). Sell it on recovered revenue, frame the roadmap as a founding-customer benefit — *more desks light up at no extra cost* — and validate on the first ten buyers.
3. **All pricing surfaces must converge.** The deployed app still shows Starter/Pro/Scale ($149/$349/$699) and the marketing site carries a founding offer ($99/$199). Generation One prices become the single source of truth; the legacy tiers and offers are retired or explicitly mapped.

## Standing commercial law

- **Bill flat. Report outcomes. Never salary-anchor the headline.** (Research Foundation, Commitments 9–10 — now evidence-backed.)
- **Both halves stand alone, honestly.** Growth Department remains standalone-purchasable; TaskBuild remains a complete operational platform. Neither may ever feel intentionally crippled. Together they compound through the Core.
- **Open desks are shown as future hires, never locked features.** The vocabulary is *hiring*, never *unlocking*. No padlocks, no nags, no badges.
- **Expansion is ledger-driven.** Staffing proposals arrive through the Morning Briefing with dollar evidence from the company's own events — one at a time, rate-limited, honest under Law 1. The Demand Thermostat's quiet-week report is the flagship Growth trigger.
- **The department SKU test:** a future department becomes purchasable only when it displaces a budget line the customer already pays someone for. Otherwise it ships inside Complete Company first and earns its SKU later.
- **Customer-facing departments stay few and chunky** (three today). The internal taxonomy never leaks onto the pricing page.

---

# III — The Guardrails, ratified

Everything exists once. Everything is shared through the platform.

- No second application.
- No duplicate databases.
- No duplicate memories.
- No duplicate approval systems.
- No duplicate notifications.
- No duplicate identities.
- No duplicate billing.
- No duplicate communication engines.
- No duplicated employees.

---

# IV — The Execution Roadmap

*Audited against the current codebases, July 7, 2026. The Growth OS v0 repo still exhibits, as expected, the debts the Platform doc named: email-join identity (`lib/match.ts`), single-founder login (`lib/auth.ts`), vendor-shaped modules (`apify.ts`, `cal.ts`, `mailer.ts`, `gsc.ts`, `stripe.ts`), a daily 08:00 cron as scheduler, and a k/v settings store. Per Amendment A2 these are customer-zero scaffolding — never multi-tenanted, retired by the strangler path, not rewritten in place. Phase 1 work (company_events ledger, Reputation Manager, Lifecycle Marketer) is in progress on the app repo's `platform-phase1` branch, built on the org/role infrastructure as the contracts require.*

**Every item below answers one question: does it help us earn customer #1 faster without compromising the long-term platform?**

## Category 1 — Critical before first customers

1. **Entity resolution before any Growth customer (D1).** The Entities store with real identity — no customer is ever touched through an email-string join. The single scariest debt; non-negotiable.
2. **Ship Phase 1 on the platform (D2/D3).** Lifecycle + Reputation as employees in the app's org/role/entitlement infrastructure, writing to the unified Record from their first event. Finish the `platform-phase1` pending items (migration SQL, hire flow, review-URL setup) and run it live.
3. **Department entitlements + Generation One billing (D11).** The four SKUs as entitlement bundles on the app's existing per-plan gating pattern; Stripe products at $199/$499/$599/$899; one invoice, department line items. No Growth dollar is charged through a second billing relationship.
4. **Pricing surface convergence.** App billing page and marketing site adopt the Generation One names and prices; retire Starter/Pro/Scale and reconcile the founding offer. One source of truth for every number.
5. **Front Office voice decision.** Include voice with a capped minutes allowance (fence on volume, not channel); implement the cap.
6. **One Door + one Briefing for Phase 1.** Growth drafts land in the existing approval queue; the growth report ships as a section of the one Morning Briefing — no second surface (A1/A3).

## Category 2 — Important after first paying customers

7. **Decisions store → computed autonomy (D8).** Track records as data; Draft → Approve → Auto per play, derived not toggled.
8. **Notification Engine (D9).** The booking SMS generalized into the one-badge attention budget.
9. **Ledger-driven expansion triggers.** Staffing proposals in the briefing with receipts; Demand Thermostat quiet-week trigger first.
10. **Open-desk experience.** Unstaffed departments visible as future hires across the HQ, speaking only when the ledger gives them standing.
11. **Trigger Engine (D5).** Events first; the 08:00 cron demoted to calendar-shaped work.
12. **Capability interfaces (D6) + Model Routing table (D10).** Each vendor module converted as it is next touched; model choices moved to the routing table.
13. **Standalone Growth surface.** The ops-lite pipeline, phone handoffs, one-tap "job done?" — required before selling Growth to Jobber/Housecall/ServiceTitan users, not before customer #1.
14. **One Outreach Engine (D7).** Hard gate: no Phase 3 productized outbound until sequences, consent, touch history, and circuit breakers exist exactly once.

## Category 3 — Long-term platform evolution

15. **Payments take-rate** as the third revenue axis (the ServiceTitan silent 25%) — billing layer designed to accommodate it; not shipped yet.
16. **Vertical packs (D12)** — consent boundary designed into the Core schema when Entities land; the capability itself waits for Phase 4+.
17. **Capacity scalar re-evaluation** — conversations vs. managed jobs, once Estimator/Dispatcher volume dominates. Never per-seat.
18. **Moat migration** — pricing power moved from "cheaper than the agency" to the Core's compounding memory, before the agency umbrella compresses.
19. **Strangler completion** — v0's proven engines ported into the platform as they graduate; the scaffolding thanked and dismantled.

Standing law throughout: **prefer shipping over perfection; prefer customer validation over theoretical elegance.** Work that doesn't unblock a phase or retire a debt line waits.

---

# V — Amendment

These decisions are settled. They yield only to **real customer evidence** — a price customers demonstrably won't pay, a fence that demonstrably reads as punitive, a department name that demonstrably confuses. Amendments follow the founding documents' changelog process: small, precise, evidenced. Nobody redesigns this for elegance.

---

> **The design era produced one company, one building, one Core, and a hiring ladder a roofer understands on sight. The execution era has exactly one objective: customer #1.**

*GENERATION ONE · RATIFIED JULY 7, 2026 · GOVERNED BY THE SEVEN LAWS · NOW: EXECUTE*
