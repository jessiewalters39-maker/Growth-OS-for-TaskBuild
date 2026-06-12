"use client";

import { useCallback, useEffect, useState } from "react";
import type { Lead } from "@/lib/schema";
import {
  INDUSTRIES,
  LEAD_SOURCES,
  LEAD_STATUSES,
  LEAD_TIERS,
  STATUS_LABELS,
} from "@/lib/constants";
import { Btn, Card, Input, Select, Table, Tag, Td, Th, cx } from "./ui";
import { LeadDrawer } from "./LeadDrawer";

type Filters = {
  status: string;
  tier: string;
  industry: string;
  source: string;
  q: string;
};

const EMPTY: Filters = { status: "", tier: "", industry: "", source: "", q: "" };

export function tierTone(tier: string | null) {
  return tier === "Hot"
    ? "hot"
    : tier === "Warm"
      ? "warm"
      : tier === "Cold"
        ? "cold"
        : "default";
}
export function statusTone(status: string) {
  return status === "customer"
    ? "good"
    : status === "demo_booked"
      ? "accent"
      : "default";
}

export function LeadCenter({ defaultIndustry }: { defaultIndustry: string }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) if (v) qs.set(k, v);
    const res = await fetch(`/api/leads?${qs.toString()}`);
    setLeads(res.ok ? await res.json() : []);
    setLoading(false);
  }, [filters]);

  // Debounce so typing in search doesn't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  // Replace a lead in the list (after edit/score) and keep the drawer in sync.
  function upsertLocal(lead: Lead) {
    setLeads((prev) => prev.map((l) => (l.id === lead.id ? lead : l)));
    setSelected((s) => (s && s.id === lead.id ? lead : s));
  }
  function removeLocal(id: number) {
    setLeads((prev) => prev.filter((l) => l.id !== id));
  }

  const set = (k: keyof Filters) => (v: string) =>
    setFilters((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Lead Center</h1>
        <div className="flex gap-2">
          <Btn variant="ghost" onClick={() => setShowImport(true)}>
            Import CSV
          </Btn>
          <Btn onClick={() => setShowAdd(true)}>+ Add lead</Btn>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search company, contact, email, city…"
          value={filters.q}
          onChange={(e) => set("q")(e.target.value)}
          className="w-64"
        />
        <FilterSelect
          value={filters.status}
          onChange={set("status")}
          placeholder="All statuses"
          options={LEAD_STATUSES.map((s) => [s, STATUS_LABELS[s]])}
        />
        <FilterSelect
          value={filters.tier}
          onChange={set("tier")}
          placeholder="All tiers"
          options={LEAD_TIERS.map((t) => [t, t])}
        />
        <FilterSelect
          value={filters.industry}
          onChange={set("industry")}
          placeholder="All industries"
          options={INDUSTRIES.map((i) => [i, i])}
        />
        <FilterSelect
          value={filters.source}
          onChange={set("source")}
          placeholder="All sources"
          options={LEAD_SOURCES.map((s) => [s, s])}
        />
        {Object.values(filters).some(Boolean) && (
          <button
            onClick={() => setFilters(EMPTY)}
            className="text-xs text-muted hover:text-fg"
          >
            Clear
          </button>
        )}
        <span className="ml-auto text-xs text-muted">
          {loading ? "Loading…" : `${leads.length} lead${leads.length === 1 ? "" : "s"}`}
        </span>
      </div>

      {/* Table */}
      {leads.length === 0 && !loading ? (
        <Card className="text-sm text-muted">
          No leads yet. Add one manually, import a CSV, or POST to the webhook
          (see Settings for the curl example).
        </Card>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Company</Th>
              <Th>Contact</Th>
              <Th>Location</Th>
              <Th>Industry</Th>
              <Th>Source</Th>
              <Th>Status</Th>
              <Th className="text-right">Score</Th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr
                key={l.id}
                onClick={() => setSelected(l)}
                className="cursor-pointer transition-colors hover:bg-surface-2/60"
              >
                <Td className="font-medium">{l.company}</Td>
                <Td className="text-muted">
                  {l.owner || l.email || l.phone || "—"}
                </Td>
                <Td className="text-muted">
                  {[l.city, l.state].filter(Boolean).join(", ") || "—"}
                </Td>
                <Td className="text-muted">{l.industry}</Td>
                <Td>
                  <Tag>{l.source}</Tag>
                </Td>
                <Td>
                  <Tag tone={statusTone(l.status)}>
                    {STATUS_LABELS[l.status] ?? l.status}
                  </Tag>
                </Td>
                <Td className="text-right">
                  {l.tier ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="tabular-nums text-muted">{l.score}</span>
                      <Tag tone={tierTone(l.tier)}>{l.tier}</Tag>
                    </span>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {selected && (
        <LeadDrawer
          lead={selected}
          onClose={() => setSelected(null)}
          onChange={upsertLocal}
          onDelete={(id) => {
            removeLocal(id);
            setSelected(null);
          }}
        />
      )}
      {showAdd && (
        <AddLeadModal
          defaultIndustry={defaultIndustry}
          onClose={() => setShowAdd(false)}
          onCreated={() => {
            setShowAdd(false);
            load();
          }}
        />
      )}
      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onDone={() => load()}
        />
      )}
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: [string, string][];
}) {
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)} className="text-xs">
      <option value="">{placeholder}</option>
      {options.map(([v, label]) => (
        <option key={v} value={v}>
          {label}
        </option>
      ))}
    </Select>
  );
}

// ── Add lead modal ────────────────────────────────────────────────────────
function AddLeadModal({
  defaultIndustry,
  onClose,
  onCreated,
}: {
  defaultIndustry: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    company: "",
    owner: "",
    email: "",
    phone: "",
    website: "",
    city: "",
    state: "",
    industry: defaultIndustry,
    source: "Manual",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const f = (k: keyof typeof form) => (v: string) =>
    setForm((s) => ({ ...s, [k]: v }));

  async function submit() {
    if (!form.company.trim()) return setError("Company is required");
    setSaving(true);
    setError("");
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) onCreated();
    else setError((await res.json().catch(() => ({})))?.error || "Failed to add");
  }

  return (
    <Modal title="Add lead" onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Company *" className="col-span-2">
          <Input value={form.company} onChange={(e) => f("company")(e.target.value)} />
        </Field>
        <Field label="Contact">
          <Input value={form.owner} onChange={(e) => f("owner")(e.target.value)} />
        </Field>
        <Field label="Email">
          <Input value={form.email} onChange={(e) => f("email")(e.target.value)} />
        </Field>
        <Field label="Phone">
          <Input value={form.phone} onChange={(e) => f("phone")(e.target.value)} />
        </Field>
        <Field label="Website">
          <Input value={form.website} onChange={(e) => f("website")(e.target.value)} />
        </Field>
        <Field label="City">
          <Input value={form.city} onChange={(e) => f("city")(e.target.value)} />
        </Field>
        <Field label="State">
          <Input value={form.state} onChange={(e) => f("state")(e.target.value)} />
        </Field>
        <Field label="Industry">
          <Select
            value={form.industry}
            onChange={(e) => f("industry")(e.target.value)}
            className="w-full"
          >
            {INDUSTRIES.map((i) => (
              <option key={i}>{i}</option>
            ))}
          </Select>
        </Field>
        <Field label="Source">
          <Select
            value={form.source}
            onChange={(e) => f("source")(e.target.value)}
            className="w-full"
          >
            {LEAD_SOURCES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
        </Field>
      </div>
      {error && <div className="mt-3 text-sm text-hot">{error}</div>}
      <div className="mt-4 flex justify-end gap-2">
        <Btn variant="ghost" onClick={onClose}>
          Cancel
        </Btn>
        <Btn onClick={submit} disabled={saving}>
          {saving ? "Adding…" : "Add lead"}
        </Btn>
      </div>
    </Modal>
  );
}

// ── Import CSV modal ──────────────────────────────────────────────────────
function ImportModal({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone: () => void;
}) {
  const [csv, setCsv] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ inserted: number; skipped: number } | null>(
    null,
  );
  const [error, setError] = useState("");

  async function submit() {
    setBusy(true);
    setError("");
    setResult(null);
    const res = await fetch("/api/leads/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv }),
    });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setResult(data);
      onDone();
    } else {
      setError(data?.error || "Import failed");
    }
  }

  return (
    <Modal title="Import CSV" onClose={onClose}>
      <p className="mb-2 text-sm text-muted">
        Paste CSV with a header row. Columns are matched fuzzily (company,
        email, phone, city, state, industry, source, owner…). Duplicates by
        email (or company + city) are skipped.
      </p>
      <textarea
        value={csv}
        onChange={(e) => setCsv(e.target.value)}
        placeholder={"company,email,city,state,phone\nAcme Roofing,info@acme.com,Tyler,TX,9035551234"}
        className="h-48 w-full rounded-lg border border-line bg-surface-2 p-3 font-mono text-xs text-fg placeholder:text-muted focus:border-accent focus:outline-none"
      />
      <input
        type="file"
        accept=".csv,text/csv"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) setCsv(await file.text());
        }}
        className="mt-2 text-xs text-muted file:mr-3 file:rounded-md file:border-0 file:bg-surface-2 file:px-2 file:py-1 file:text-fg"
      />
      {result && (
        <div className="mt-3 text-sm text-good">
          Imported {result.inserted}, skipped {result.skipped}.
        </div>
      )}
      {error && <div className="mt-3 text-sm text-hot">{error}</div>}
      <div className="mt-4 flex justify-end gap-2">
        <Btn variant="ghost" onClick={onClose}>
          Close
        </Btn>
        <Btn onClick={submit} disabled={busy || !csv.trim()}>
          {busy ? "Importing…" : "Import"}
        </Btn>
      </div>
    </Modal>
  );
}

// ── Local layout helpers (kept out of the 6 shared primitives) ────────────
export function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cx("block", className)}>
      <span className="mb-1 block text-xs text-muted">{label}</span>
      {children}
    </label>
  );
}

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-line bg-surface p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-muted hover:text-fg">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
