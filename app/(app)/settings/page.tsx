import { headers } from "next/headers";
import { Card, Tag } from "@/components/ui";
import { CopyButton } from "@/components/CopyButton";
import { getAppSettings, getSetting } from "@/lib/settings";

type SyncInfo = { at?: string; upserted?: number; matched?: number } | null;

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
  const { industry, location } = await getAppSettings();
  const [lastCal, lastStripe] = await Promise.all([
    getSetting<SyncInfo>("last_cal_sync", null),
    getSetting<SyncInfo>("last_stripe_sync", null),
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
          (Website Form | Chat | SMS), landing_page, industry, city, state. At
          least one of company or email is required. Leads are de-duplicated by
          email.
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
        </div>
        <p className="mt-3 text-xs text-muted">
          Synced once daily by the cron at <code className="text-fg">/api/jobs/daily</code>.
          Use a <strong>restricted, read-only</strong> Stripe key — this app never
          writes to Stripe.
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
}: {
  name: string;
  env: string;
  info: { at?: string; upserted?: number; matched?: number } | null;
  agoText: string;
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
            {info.upserted ?? 0} records · {info.matched ?? 0} matched
          </div>
        )}
      </div>
    </div>
  );
}
