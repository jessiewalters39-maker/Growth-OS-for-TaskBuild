# TaskBuildAI — Growth OS

The deployed Growth Operating System for TaskBuildAI. One founder, one app:
acquire the first 50 paying customers for AI employees sold to home-service
businesses (roofing, HVAC, plumbing, etc.).

**Lean by design** — one Next.js app, one Postgres database, one daily cron.
Target cost: under $5/month (Vercel Hobby + Neon free tier + on-demand
Anthropic API).

## Product surface

1. **Lead Center** — pipeline CRM with AI scoring (Hot/Warm/Cold)
2. **Outreach Engine** — AI-personalized 9-message sequences (founder sends manually)
3. **AI CMO** — weekly executive report generated from real data
4. **Ingestion** — TaskBuildAI website webhook + CSV import
5. **Cal.com** bookings sync (demos)
6. **Stripe** revenue sync (customers, MRR — read-only)

Deferred (seams only, not built): Google Search Console, GA4, Resend email
sending, competitor monitoring, multi-user auth.

## Stack

- Next.js 16 (App Router) + TypeScript, deployed on Vercel Hobby
- Neon Postgres (serverless) + Drizzle ORM
- Anthropic SDK — `claude-sonnet-4-6`, on-demand only
- Tailwind v4, dark theme, six hand-built UI primitives
- Auth: single shared password → HMAC-signed httpOnly cookie (no auth library)
- Cal.com + Stripe accessed via native `fetch` (no SDK packages)

## Local setup

```bash
npm install
cp .env.example .env.local      # fill in the values below
npm run db:generate             # (already committed) generate migration SQL
npm run db:push                 # push schema to your Neon DB
npm run dev                     # http://localhost:3000
```

### Environment variables

| Var                  | What                                                            |
| -------------------- | -------------------------------------------------------------- |
| `DATABASE_URL`       | Neon pooled connection string                                  |
| `ANTHROPIC_API_KEY`  | Anthropic API key                                              |
| `ADMIN_PASSWORD`     | the single login password                                      |
| `SESSION_SECRET`     | 32+ random bytes (`openssl rand -hex 32`) — signs the cookie   |
| `LEAD_WEBHOOK_SECRET`| shared secret the website sends in `x-webhook-secret`          |
| `CRON_SECRET`        | Bearer secret the daily cron presents                          |
| `CAL_API_KEY`        | Cal.com → Settings → Developer → API keys                      |
| `STRIPE_SECRET_KEY`  | **Restricted, read-only** key (Customers + Subscriptions only) |

> ⚠️ Use a **restricted read-only** Stripe key. This app never writes to Stripe.

## Deploy (Vercel)

1. Push this repo to GitHub.
2. Import it on Vercel (Hobby plan). Framework auto-detected as Next.js.
3. Add every variable above in Project → Settings → Environment Variables.
4. Create a Neon database, copy the pooled `DATABASE_URL`.
5. From your machine (with the production `DATABASE_URL` in `.env.local`):
   `npm run db:push`.
6. Deploy. The daily cron is configured in `vercel.json` (added in milestone M3).

## Database

Drizzle schema lives in [`lib/schema.ts`](lib/schema.ts); generated migrations in
`drizzle/`. `npm run db:push` applies the schema directly (simplest for a
single-operator app); `npm run db:migrate` runs versioned migrations if you
prefer.

## Project layout

```
app/
  login/                 # bare login page
  (app)/                 # authenticated shell (top bar w/ industry/location mode)
    page.tsx             # Dashboard
    leads/  cmo/  settings/
  api/
    auth/                # login, logout
    settings/            # GET/POST industry + location mode
    leads/ ...           # (M1+)
    webhooks/leads/      # (M1) public, secret-protected
    jobs/daily/          # (M3) cron, secret-protected
lib/
  db.ts schema.ts        # Drizzle + Neon
  session.ts auth.ts     # HMAC cookie (session.ts is edge-safe for proxy.ts)
  settings.ts constants.ts
proxy.ts                 # auth gate (Next 16 "proxy", formerly middleware)
```

## Milestones

- **M0** — skeleton on the internet (auth, shell, schema) ✅
- **M1** — Lead Center + ingestion (CRUD, CSV, webhook, AI scoring)
- **M2** — Outreach Engine (AI sequences, copy buttons)
- **M3** — real funnel (Cal.com + Stripe sync, cron, dashboard)
- **M4** — AI CMO (weekly report)
