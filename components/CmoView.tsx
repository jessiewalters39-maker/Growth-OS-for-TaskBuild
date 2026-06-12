"use client";

import { useState } from "react";
import type { CmoPayload } from "@/lib/prompts";
import { Btn, Card, Tag } from "./ui";

export type Report = {
  id: number;
  weekOf: string;
  payload: CmoPayload;
  createdAt: string | null;
};

export function CmoView({
  initialLatest,
  initialHistory,
}: {
  initialLatest: Report | null;
  initialHistory: Report[];
}) {
  const [latest, setLatest] = useState<Report | null>(initialLatest);
  const [history, setHistory] = useState<Report[]>(initialHistory);
  const [selected, setSelected] = useState<Report | null>(initialLatest);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/cmo", { method: "POST" });
    setBusy(false);
    if (!res.ok) {
      setError("Generation failed — check ANTHROPIC_API_KEY and that data exists");
      return;
    }
    const report: Report = await res.json();
    setHistory((h) => (latest ? [latest, ...h] : h).slice(0, 8));
    setLatest(report);
    setSelected(report);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">AI CMO</h1>
        <Btn onClick={generate} disabled={busy}>
          {busy ? "Generating…" : "Generate now"}
        </Btn>
      </div>
      {error && <div className="text-sm text-hot">{error}</div>}

      {!selected ? (
        <Card className="text-sm text-muted">
          No report yet. The CMO runs automatically each Monday from real funnel
          data, or generate one now. It only cites numbers it actually has — if a
          dataset is empty, it tells you to go fill it.
        </Card>
      ) : (
        <ReportBody report={selected} isLatest={selected.id === latest?.id} />
      )}

      {history.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-muted">History</h2>
          <div className="space-y-2">
            {history.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelected(r)}
                className={`block w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                  selected?.id === r.id
                    ? "border-accent bg-surface-2"
                    : "border-line bg-surface hover:border-line-2"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm">{r.payload.headline}</span>
                  <span className="shrink-0 text-xs text-muted">
                    Week of {r.weekOf}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ReportBody({ report, isLatest }: { report: Report; isLatest: boolean }) {
  const p = report.payload;
  return (
    <div className="space-y-4">
      {/* Headline banner */}
      <Card className="border-accent/40 bg-gradient-to-br from-surface to-surface-2">
        <div className="mb-1 flex items-center gap-2">
          <Tag tone="accent">Week of {report.weekOf}</Tag>
          {isLatest && <Tag tone="good">Latest</Tag>}
        </div>
        <div className="text-lg font-semibold">{p.headline}</div>
      </Card>

      {/* Worked / Failed */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h3 className="mb-2 text-sm font-semibold text-good">What worked</h3>
          <List items={p.worked} empty="Nothing logged yet." />
        </Card>
        <Card>
          <h3 className="mb-2 text-sm font-semibold text-hot">What didn&apos;t</h3>
          <List items={p.failed} empty="Nothing flagged." />
        </Card>
      </div>

      {/* Drivers */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="text-xs uppercase tracking-wide text-muted">
            Demos driver
          </div>
          <div className="mt-1 text-sm">{p.demosDriver}</div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wide text-muted">
            Customers driver
          </div>
          <div className="mt-1 text-sm">{p.customersDriver}</div>
        </Card>
      </div>

      {/* Next bets */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="text-xs uppercase tracking-wide text-muted">
            Next industry to target
          </div>
          <div className="mt-1 font-medium">{p.nextIndustry?.industry}</div>
          <div className="mt-1 text-sm text-muted">{p.nextIndustry?.why}</div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wide text-muted">
            Next market to target
          </div>
          <div className="mt-1 font-medium">{p.nextMarket?.location}</div>
          <div className="mt-1 text-sm text-muted">{p.nextMarket?.why}</div>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <h3 className="mb-2 text-sm font-semibold">This week&apos;s 5 actions</h3>
        <ol className="space-y-2">
          {p.actions?.map((a, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent/20 text-xs font-semibold text-accent-2">
                {i + 1}
              </span>
              <span>{a}</span>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}

function List({ items, empty }: { items: string[]; empty: string }) {
  if (!items?.length) return <div className="text-sm text-muted">{empty}</div>;
  return (
    <ul className="space-y-1.5">
      {items.map((it, i) => (
        <li key={i} className="flex gap-2 text-sm">
          <span className="text-muted">•</span>
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}
