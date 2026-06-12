import { Card, Tag } from "@/components/ui";

// M0 placeholder dashboard. Wired to real aggregates in M3.
export default function DashboardPage() {
  const cards = [
    { label: "Leads", value: "—", sub: "total in pipeline" },
    { label: "Demos", value: "—", sub: "live: Cal.com" },
    { label: "Customers", value: "—", sub: "live: Stripe" },
    { label: "MRR", value: "—", sub: "live: Stripe" },
  ];
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <Tag tone="accent">v1 skeleton</Tag>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <div className="text-sm text-muted">{c.label}</div>
            <div className="mt-1 text-3xl font-semibold tabular-nums">
              {c.value}
            </div>
            <div className="mt-1 text-xs text-muted">{c.sub}</div>
          </Card>
        ))}
      </div>

      <Card className="text-sm text-muted">
        The funnel, trends, and CMO headline light up once leads, Cal.com
        bookings, and Stripe customers start flowing in (milestones M1–M4).
      </Card>
    </div>
  );
}
