import Link from "next/link";
import { Card, Table, Tag, Td, Th } from "@/components/ui";
import { Sparkline } from "@/components/Sparkline";
import { getDashboard, type DashboardData } from "@/lib/dashboard";

function money(cents: number): string {
  return `$${Math.round(cents / 100).toLocaleString()}`;
}

function ago(iso: string | null): string {
  if (!iso) return "never synced";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default async function DashboardPage() {
  let data: DashboardData | null = null;
  try {
    data = await getDashboard();
  } catch {
    data = null;
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <Card className="text-sm text-muted">
          Could not load metrics — is <code className="text-fg">DATABASE_URL</code>{" "}
          set? Once the database is connected and the daily sync runs, the funnel
          lights up here.
        </Card>
      </div>
    );
  }

  const { funnel, bySource, trend, cmoHeadline, freshness } = data;
  const cards = [
    {
      label: "Leads",
      value: funnel.leads.toLocaleString(),
      series: trend.map((t) => t.leads ?? 0),
      badge: null,
    },
    {
      label: "Demos",
      value: funnel.demos.toLocaleString(),
      series: trend.map((t) => t.demos ?? 0),
      badge: "live: Cal.com",
    },
    {
      label: "Customers",
      value: funnel.customers.toLocaleString(),
      series: trend.map((t) => t.customers ?? 0),
      badge: "live: Stripe",
    },
    {
      label: "MRR",
      value: money(funnel.mrrCents),
      series: trend.map((t) => t.mrr ?? 0),
      badge: "live: Stripe",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <div className="flex gap-2 text-xs">
          <Tag tone={freshness.cal ? "good" : "default"}>
            Cal.com · {ago(freshness.cal)}
          </Tag>
          <Tag tone={freshness.stripe ? "good" : "default"}>
            Stripe · {ago(freshness.stripe)}
          </Tag>
        </div>
      </div>

      {/* Funnel cards with sparklines */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">{c.label}</span>
              {c.badge && <Tag tone="accent">{c.badge}</Tag>}
            </div>
            <div className="mt-1 text-3xl font-semibold tabular-nums">
              {c.value}
            </div>
            <div className="mt-2">
              <Sparkline values={c.series} />
            </div>
          </Card>
        ))}
      </div>

      {/* Latest CMO headline */}
      <Link href="/cmo" className="block">
        <Card className="transition-colors hover:border-line-2">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wide text-muted">
              Latest CMO read
            </span>
            <span className="text-xs text-accent-2">View report →</span>
          </div>
          <div className="mt-1 text-sm">
            {cmoHeadline ?? "No CMO report yet — generated Mondays from real data."}
          </div>
        </Card>
      </Link>

      {/* Leads by source */}
      <div>
        <h2 className="mb-2 text-sm font-semibold text-muted">Leads by source</h2>
        {bySource.length === 0 ? (
          <Card className="text-sm text-muted">No leads yet.</Card>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Source</Th>
                <Th className="text-right">Leads</Th>
                <Th className="text-right">Demos</Th>
                <Th className="text-right">Customers</Th>
              </tr>
            </thead>
            <tbody>
              {bySource.map((s) => (
                <tr key={s.source}>
                  <Td>
                    <Tag>{s.source}</Tag>
                  </Td>
                  <Td className="text-right tabular-nums">{s.total}</Td>
                  <Td className="text-right tabular-nums">{s.demos}</Td>
                  <Td className="text-right tabular-nums">{s.customers}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>
    </div>
  );
}
