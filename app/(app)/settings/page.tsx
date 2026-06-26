import { headers } from "next/headers";
import { Card, Tag } from "@/components/ui";
import { CopyButton } from "@/components/CopyButton";
import { SenderNameForm } from "@/components/SenderNameForm";
import { DailyCapForm } from "@/components/DailyCapForm";
import { OutreachLinksForm } from "@/components/OutreachLinksForm";
import { getAppSettings, getSetting } from "@/lib/settings";
import { mailerConfigured } from "@/lib/mailer";

type SyncInfo = { at?: string; upserted?: number; matched?: number } | null;
type GscSyncInfo = { at?: string; clicks?: number; impressions?: number } | null;

function ago(iso?: string): string {
  if (!iso) return "never";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default async function SettingsPage() {
  const { industry, location, senderName, dailySendCap, bookingUrl, websiteUrl } =
    await getAppSettings();
  const mailerReady = mailerConfigured();
  const [lastCal, lastStripe, lastGsc] = await Promise.all([
    getSetting<SyncInfo>("last_cal_sync", null),
    getSetting<SyncInfo>("last_stripe_sync", null),
    getSetting<GscSyncInfo>("last_gsc_sync", null),
  ]);

  // Build the absolute webhook URL from the incoming request.
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const webhookUrl = `${proto}://${host}/api/webhooks/leads`;
  const secret = process.env.LEAD_WEBHOOK_SECRET || "<LEAD_WEBHOOK_SECRET>";

  const curl = `curl -X POST ${webhookUrl} \\
  -H "Content-Type: application/json" \\
  -H "x-webhook-secret: ${secret}" \\
  -d '{
    "company": "Acme Roofing",
    "owner": "Jane Doe",
    "email": "info@acmeroofing.com",
    "phone": "903-555-1234",
    "source": "Website Form",
    "landing_page": "/roofing",
    "industry": "Roofing",
    "city": "Tyler",
    "state": "TX"
  }'`;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Settings</h1>

      <Card>
        <div className="text-sm text-muted">Target market mode</div>
        <div className="mt-1 text-lg font-medium">
          {industry}
          {location ? ` · ${location}` : ""}
        </div>
        <p className="mt-2 text-sm text-muted">
          Change the industry and location from the top bar. This mode is
          injected into AI lead scoring, outreach sequences, and the weekly CMO
          report.
        </p>
      </Card>

      <Card>
        <div className="text-sm text-muted">Sender identity</div>
        <p className="mt-2 text-sm text-muted">
          The name every generated outreach email and LinkedIn message is signed
          with. Pinning it here stops the AI from inventing different names.
        </p>
        <SenderNameForm initial={senderName} />
      </Card>

      <Card>
        <div className="text-sm text-muted">Outreach links</div>
        <p className="mt-2 text-sm text-muted">
          Injected into every generated sequence. The <strong>booking link</strong>{" "}
          becomes the call-to-action in each email; the <strong>website</strong> is
          referenced once for credibility. Without a booking link, emails ask the
          lead to reply instead — set yours so every campaign has a real CTA.
        </p>
        <div className="mt-3">
          <OutreachLinksForm booking={bookingUrl} website={websiteUrl} />
        </div>
      </Card>

      <Card>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-medium">Lead webhook</h2>
          <Tag tone="accent">Website integration</Tag>
        </div>
        <p className="text-sm text-muted">
          Point your TaskBuildAI website forms, chat widget, and SMS handler at
          this endpoint. Every POST creates (or updates) a lead and auto-scores
          new ones. The <code className="text-fg">x-webhook-secret</code> header
          must match <code className="text-fg">LEAD_WEBHOOK_SECRET</code>.
        </p>

        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs text-muted">Endpoint</span>
            <CopyButton text={webhookUrl} />
          </div>
          <code className="block break-all rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm">
            {webhookUrl}
          </code>
        </div>

        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs text-muted">Example request</span>
            <CopyButton text={curl} label="Copy curl" />
          </div>
          <pre className="overflow-x-auto rounded-lg border border-line bg-surface-2 px-3 py-2 text-xs leading-relaxed text-fg">
            {curl}
          </pre>
        </div>

        <p className="mt-3 text-xs text-muted">
          Accepts JSON fields: company, owner, email, phone, source
          (Website Form | Chat | SMS), landing_page, industry, city, state. For
          channel attribution, also send the visitor&apos;s first-touch{" "}
          <code className="text-fg">referrer</code>,{" "}
          <code className="text-fg">utm_source</code>, and{" "}
          <code className="text-fg">utm_medium</code> — leads are then bucketed
          as Organic Search / Paid Search / Social / Referral in the CMO report.
          At least one of company or email is required. Leads are de-duplicated
          by email.
        </p>
      </Card>

      <Card>
        <h2 className="mb-3 font-medium">Integrations</h2>
        <div className="space-y-2">
          <SyncRow
            name="Cal.com"
            env="CAL_API_KEY"
            info={lastCal}
            agoText={ago(lastCal?.at)}
          />
          <SyncRow
            name="Stripe"
            env="STRIPE_SECRET_KEY"
            info={lastStripe}
            agoText={ago(lastStripe?.at)}
          />
          <SyncRow
            name="Search Console"
            env="GSC_CLIENT_ID"
            info={lastGsc}
            agoText={ago(lastGsc?.at)}
            detail={
              lastGsc?.at
                ? `${lastGsc.clicks ?? 0} clicks · ${lastGsc.impressions ?? 0} impressions (7d)`
                : undefined
            }
          />
        </div>
        <p className="mt-3 text-xs text-muted">
          Synced once daily by the cron at <code className="text-fg">/api/jobs/daily</code>.
          Use a <strong>restricted, read-only</strong> Stripe key — this app never
          writes to Stripe.
        </p>
      </Card>

      <Card>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-medium">Email sending (Gmail / Workspace SMTP)</h2>
          <Tag tone={mailerReady ? "good" : "default"}>
            {mailerReady ? "configured" : "not configured"}
          </Tag>
        </div>
        <p className="text-sm text-muted">
          Outreach emails send from your own Google Workspace mailbox, so they
          come from a real inbox and replies land back in Gmail. Set these env
          vars:
        </p>
        <ul className="mt-2 space-y-1 text-sm text-muted">
          <li>
            <code className="text-fg">SMTP_USER</code> — your mailbox, e.g.{" "}
            <code className="text-fg">jessie@taskbuildai.com</code> (the From address)
          </li>
          <li>
            <code className="text-fg">SMTP_PASSWORD</code> — a Google{" "}
            <strong>App Password</strong> (Account → Security → App passwords;
            requires 2-Step Verification)
          </li>
          <li>
            <code className="text-fg">SMTP_HOST</code> — optional, defaults to{" "}
            <code className="text-fg">smtp.gmail.com</code>
          </li>
          <li>
            <code className="text-fg">SMTP_PORT</code> — optional, defaults to{" "}
            <code className="text-fg">465</code>
          </li>
        </ul>
        <div className="mt-4 border-t border-line pt-3">
          <div className="text-sm font-medium">Daily send cap</div>
          <p className="mb-2 mt-1 text-xs text-muted">
            The Outreach tab blocks sending once this many emails have gone out in
            a rolling 24 hours — a guard against over-sending and getting your
            inbox throttled. Start low (~20–30) and ramp up slowly.
          </p>
          <DailyCapForm initial={dailySendCap} />
        </div>
        <p className="mt-3 text-xs text-muted">
          Emails sign off with the <strong>Sender identity</strong> name above.
          Send them one at a time from a lead&apos;s Outreach tab — Google
          enforces daily sending limits (~500/day personal, ~2,000/day
          Workspace) and polices bulk cold mail, so keep volume modest.
        </p>
      </Card>
    </div>
  );
}

function SyncRow({
  name,
  env,
  info,
  agoText,
  detail,
}: {
  name: string;
  env: string;
  info: { at?: string; upserted?: number; matched?: number } | null;
  agoText: string;
  detail?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-line bg-surface-2 px-3 py-2">
      <div>
        <div className="text-sm font-medium">{name}</div>
        <div className="text-xs text-muted">{env}</div>
      </div>
      <div className="text-right">
        <Tag tone={info?.at ? "good" : "default"}>
          {info?.at ? `synced ${agoText}` : "not synced"}
        </Tag>
        {info?.at && (
          <div className="mt-1 text-xs text-muted">
            {detail ?? `${info.upserted ?? 0} records · ${info.matched ?? 0} matched`}
          </div>
        )}
      </div>
    </div>
  );
}
