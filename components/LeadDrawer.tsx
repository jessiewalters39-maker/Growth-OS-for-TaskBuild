"use client";

import { useState } from "react";
import type { Lead } from "@/lib/schema";
import { INDUSTRIES, LEAD_STATUSES, STATUS_LABELS } from "@/lib/constants";
import { Btn, Input, Select, Tag, cx } from "./ui";
import { tierTone } from "./LeadCenter";
import { OutreachTab } from "./OutreachTab";

export function LeadDrawer({
  lead,
  onClose,
  onChange,
  onDelete,
}: {
  lead: Lead;
  onClose: () => void;
  onChange: (lead: Lead) => void;
  onDelete: (id: number) => void;
}) {
  const [tab, setTab] = useState<"details" | "outreach">("details");
  const [scoring, setScoring] = useState(false);
  const [scoreErr, setScoreErr] = useState("");

  // PATCH a subset of fields and reflect the returned row upward.
  async function patch(fields: Partial<Lead>) {
    const res = await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    if (res.ok) onChange(await res.json());
  }

  async function score() {
    setScoring(true);
    setScoreErr("");
    const res = await fetch(`/api/leads/${lead.id}/score`, { method: "POST" });
    setScoring(false);
    if (res.ok) onChange(await res.json());
    else setScoreErr("Scoring failed — check ANTHROPIC_API_KEY");
  }

  async function remove() {
    if (!confirm(`Delete ${lead.company}?`)) return;
    await fetch(`/api/leads/${lead.id}`, { method: "DELETE" });
    onDelete(lead.id);
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/50" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-md flex-col border-l border-line bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-line p-4">
          <div>
            <div className="text-lg font-semibold">{lead.company}</div>
            <div className="mt-1 flex items-center gap-2">
              {lead.tier ? (
                <Tag tone={tierTone(lead.tier)}>
                  {lead.tier} · {lead.score}
                </Tag>
              ) : (
                <Tag>Unscored</Tag>
              )}
              <Tag>{lead.source}</Tag>
            </div>
          </div>
          <button onClick={onClose} className="text-muted hover:text-fg">
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-line px-4 pt-3">
          {(["details", "outreach"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cx(
                "rounded-t-lg px-3 py-2 text-sm capitalize",
                tab === t
                  ? "border-b-2 border-accent text-fg"
                  : "text-muted hover:text-fg",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {tab === "details" ? (
            <div className="space-y-4">
              {/* AI score */}
              <div className="rounded-lg border border-line bg-surface-2 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">AI fit score</span>
                  <Btn size="sm" onClick={score} disabled={scoring}>
                    {scoring ? "Scoring…" : lead.score ? "Re-score" : "Score lead"}
                  </Btn>
                </div>
                {lead.scoreReason ? (
                  <p className="text-sm text-muted">{lead.scoreReason}</p>
                ) : (
                  <p className="text-sm text-muted">
                    Not scored yet. Scores fit for the AI-receptionist product in
                    your current target market.
                  </p>
                )}
                {scoreErr && <p className="mt-1 text-sm text-hot">{scoreErr}</p>}
              </div>

              {/* Status + industry */}
              <div className="grid grid-cols-2 gap-3">
                <DrawerField label="Status">
                  <Select
                    value={lead.status}
                    onChange={(e) => patch({ status: e.target.value })}
                    className="w-full"
                  >
                    {LEAD_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </Select>
                </DrawerField>
                <DrawerField label="Industry">
                  <Select
                    value={lead.industry}
                    onChange={(e) => patch({ industry: e.target.value })}
                    className="w-full"
                  >
                    {INDUSTRIES.map((i) => (
                      <option key={i}>{i}</option>
                    ))}
                  </Select>
                </DrawerField>
              </div>

              {/* Editable contact fields (save on blur) */}
              <EditableField label="Contact" value={lead.owner} onSave={(v) => patch({ owner: v })} />
              <EditableField
                label="Email"
                value={lead.email}
                onSave={(v) => patch({ email: v })}
                link={lead.email ? `mailto:${lead.email}` : undefined}
              />
              <EditableField
                label="Phone"
                value={lead.phone}
                onSave={(v) => patch({ phone: v })}
                link={lead.phone ? `tel:${lead.phone}` : undefined}
              />
              <EditableField
                label="Website"
                value={lead.website}
                onSave={(v) => patch({ website: v })}
                link={lead.website || undefined}
              />
              <div className="grid grid-cols-2 gap-3">
                <EditableField label="City" value={lead.city} onSave={(v) => patch({ city: v })} />
                <EditableField label="State" value={lead.state} onSave={(v) => patch({ state: v })} />
              </div>
              {lead.landingPage && (
                <DrawerField label="Landing page">
                  <div className="text-sm">{lead.landingPage}</div>
                </DrawerField>
              )}

              <div className="pt-2">
                <Btn variant="danger" size="sm" onClick={remove}>
                  Delete lead
                </Btn>
              </div>
            </div>
          ) : (
            <OutreachTab lead={lead} />
          )}
        </div>
      </div>
    </div>
  );
}

function DrawerField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1 text-xs text-muted">{label}</div>
      {children}
    </div>
  );
}

function EditableField({
  label,
  value,
  onSave,
  link,
}: {
  label: string;
  value: string | null;
  onSave: (v: string) => void;
  link?: string;
}) {
  const [v, setV] = useState(value ?? "");
  return (
    <DrawerField label={label}>
      <div className="flex items-center gap-2">
        <Input
          value={v}
          onChange={(e) => setV(e.target.value)}
          onBlur={() => {
            if (v !== (value ?? "")) onSave(v);
          }}
          placeholder="—"
        />
        {link && v && (
          <a
            href={link}
            target={link.startsWith("http") ? "_blank" : undefined}
            rel="noreferrer"
            className="shrink-0 text-xs text-accent-2 hover:underline"
          >
            open
          </a>
        )}
      </div>
    </DrawerField>
  );
}
