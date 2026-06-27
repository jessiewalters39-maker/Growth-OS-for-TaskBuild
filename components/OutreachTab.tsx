"use client";

import { useEffect, useState } from "react";
import type { Lead } from "@/lib/schema";
import type { SequenceMessage, SequencePayload } from "@/lib/prompts";
import { Btn, Tag } from "./ui";
import { CopyButton } from "./CopyButton";

// Strip a phone number down to a tel/sms-safe form.
function dialable(phone: string | null): string | null {
  if (!phone) return null;
  const cleaned = phone.replace(/[^\d+]/g, "");
  return cleaned.length >= 7 ? cleaned : null;
}

// Set/clear the sentAt on one message of a channel, returning a new payload.
function stampLocal(
  prev: SequencePayload | null,
  channel: "sms" | "linkedin",
  index: number,
  sentAt: string | undefined,
): SequencePayload | null {
  if (!prev) return prev;
  const list = prev[channel].map((m, i) => (i === index ? { ...m, sentAt } : m));
  return { ...prev, [channel]: list };
}

export function OutreachTab({
  lead,
  onLeadChange,
}: {
  lead: Lead;
  onLeadChange?: (lead: Lead) => void;
}) {
  const [payload, setPayload] = useState<SequencePayload | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [quota, setQuota] = useState<{ remaining: number; cap: number } | null>(
    null,
  );

  // Load the latest saved sequence when the tab opens.
  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const res = await fetch(`/api/leads/${lead.id}/sequence`);
      if (active && res.ok) {
        const data = await res.json();
        setPayload(data.payload);
        setCreatedAt(data.createdAt);
      }
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [lead.id]);

  async function generate() {
    setGenerating(true);
    setError("");
    const res = await fetch(`/api/leads/${lead.id}/sequence`, { method: "POST" });
    setGenerating(false);
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setPayload(data.payload);
      setCreatedAt(data.createdAt);
    } else {
      // Surface the real server error instead of always blaming the API key.
      setError(data?.error || "Generation failed — please try again");
    }
  }

  // Send one email via SMTP, then reflect the sentAt stamp in local state.
  async function sendEmail(
    index: number,
  ): Promise<{ ok: boolean; error?: string }> {
    const res = await fetch(`/api/leads/${lead.id}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ index }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setPayload((prev) => {
        if (!prev) return prev;
        const emails = prev.emails.map((m, i) =>
          i === index ? { ...m, sentAt: data.sentAt } : m,
        );
        return { ...prev, emails };
      });
      if (typeof data.remaining === "number" && typeof data.cap === "number") {
        setQuota({ remaining: data.remaining, cap: data.cap });
      }
      if (data.lead) onLeadChange?.(data.lead); // New → Contacted bump
      return { ok: true };
    }
    // On a cap block (429) the body still carries cap/remaining — show it.
    if (typeof data.remaining === "number" && typeof data.cap === "number") {
      setQuota({ remaining: data.remaining, cap: data.cap });
    }
    return { ok: false, error: data.error || "Send failed" };
  }

  // Manually mark an SMS/LinkedIn touch sent (or clear it, for undo). These
  // channels are sent by hand, so the app records the stamp when you act on them.
  async function markTouch(
    channel: "sms" | "linkedin",
    index: number,
    sent: boolean,
  ) {
    // Optimistic: reflect immediately, then reconcile with the server's stamp.
    setPayload((prev) => stampLocal(prev, channel, index, sent ? "…" : undefined));
    const res = await fetch(`/api/leads/${lead.id}/sequence/mark`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel, index, sent }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setPayload((prev) => stampLocal(prev, channel, index, data.sentAt ?? undefined));
      if (data.lead) onLeadChange?.(data.lead); // New → Contacted bump
    } else {
      // Revert the optimistic change on failure.
      setPayload((prev) => stampLocal(prev, channel, index, sent ? undefined : "…"));
    }
  }

  if (loading) return <div className="text-sm text-muted">Loading…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted">
          {payload
            ? `9-message campaign${createdAt ? ` · ${new Date(createdAt).toLocaleDateString()}` : ""}`
            : "No sequence yet"}
          {quota && (
            <span className={quota.remaining === 0 ? "text-hot" : "text-muted"}>
              {" · "}
              {quota.remaining} of {quota.cap} sends left today
            </span>
          )}
        </div>
        <Btn size="sm" onClick={generate} disabled={generating}>
          {generating ? "Generating…" : payload ? "Regenerate" : "Generate sequence"}
        </Btn>
      </div>
      {error && <div className="text-sm text-hot">{error}</div>}

      {!payload && !generating && (
        <p className="text-sm text-muted">
          One click generates a personalized campaign — 5 emails, 2 SMS, and 2
          LinkedIn messages — all aimed at booking a 15-minute demo. Send the
          emails straight from your mailbox; copy the SMS and LinkedIn touches.
        </p>
      )}

      {payload && (
        <div className="space-y-5">
          <Section title="Emails">
            {payload.emails?.map((m, i) => (
              <MessageCard
                key={i}
                m={m}
                channel="email"
                lead={lead}
                index={i}
                onSend={sendEmail}
              />
            ))}
          </Section>
          <Section title="SMS">
            {payload.sms?.map((m, i) => (
              <MessageCard
                key={i}
                m={m}
                channel="sms"
                lead={lead}
                index={i}
                onMark={markTouch}
              />
            ))}
          </Section>
          <Section title="LinkedIn">
            {payload.linkedin?.map((m, i) => (
              <MessageCard
                key={i}
                m={m}
                channel="linkedin"
                lead={lead}
                index={i}
                onMark={markTouch}
              />
            ))}
          </Section>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted">
        {title}
      </div>
      {children}
    </div>
  );
}

function MessageCard({
  m,
  channel,
  lead,
  index,
  onSend,
  onMark,
}: {
  m: SequenceMessage;
  channel: "email" | "sms" | "linkedin";
  lead: Lead;
  index?: number;
  onSend?: (index: number) => Promise<{ ok: boolean; error?: string }>;
  onMark?: (channel: "sms" | "linkedin", index: number, sent: boolean) => void;
}) {
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

  // SMS/LinkedIn are sent by hand — acting on them auto-records the sent stamp.
  const manualChannel = channel === "sms" || channel === "linkedin";
  function autoMark() {
    if (manualChannel && onMark && index !== undefined && !m.sentAt) {
      onMark(channel, index, true);
    }
  }
  function undoMark() {
    if (manualChannel && onMark && index !== undefined) {
      onMark(channel, index, false);
    }
  }

  const phone = dialable(lead.phone);
  const smsHref =
    channel === "sms" && phone
      ? `sms:${phone}?body=${encodeURIComponent(m.body)}`
      : null;

  // LinkedIn is manual-only (ToS): copy the message, open the profile, you paste.
  const linkedinUrl = channel === "linkedin" ? lead.linkedinUrl : null;
  function openLinkedIn() {
    navigator.clipboard?.writeText(m.body).catch(() => {});
    if (linkedinUrl) window.open(linkedinUrl, "_blank", "noopener,noreferrer");
    autoMark();
  }

  // For email copy, include the subject line so a paste carries both.
  const copyText = m.subject ? `Subject: ${m.subject}\n\n${m.body}` : m.body;

  const canSend =
    channel === "email" && onSend && index !== undefined && Boolean(lead.email);

  async function handleSend() {
    if (!onSend || index === undefined) return;
    setSending(true);
    setSendError("");
    const res = await onSend(index);
    setSending(false);
    if (!res.ok) setSendError(res.error || "Send failed");
  }

  return (
    <div className="rounded-lg border border-line bg-surface-2 p-3">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <Tag tone="accent">{m.label}</Tag>
        <div className="flex items-center gap-1.5">
          {m.sentAt ? (
            manualChannel ? (
              <button
                onClick={undoMark}
                title="Click to undo — mark as not sent"
                className="rounded-md border border-good/30 bg-good/15 px-2 py-0.5 text-xs font-medium text-good hover:bg-good/25"
              >
                Sent
                {m.sentAt === "…"
                  ? "…"
                  : ` · ${new Date(m.sentAt).toLocaleDateString()}`}{" "}
                ✕
              </button>
            ) : (
              <Tag tone="good">
                Sent · {new Date(m.sentAt).toLocaleDateString()}
              </Tag>
            )
          ) : null}
          {channel === "email" &&
            (canSend ? (
              <button
                onClick={handleSend}
                disabled={sending}
                className="rounded-lg bg-accent px-2.5 py-1 text-xs font-medium text-white hover:bg-accent-2 disabled:opacity-50"
              >
                {sending ? "Sending…" : m.sentAt ? "Resend" : "Send"}
              </button>
            ) : (
              <span
                className="cursor-not-allowed rounded-lg bg-surface px-2.5 py-1 text-xs text-muted"
                title="This lead has no email address"
              >
                No email
              </span>
            ))}
          {smsHref && (
            <a
              href={smsHref}
              onClick={autoMark}
              className="rounded-lg bg-accent px-2.5 py-1 text-xs font-medium text-white hover:bg-accent-2"
            >
              Text
            </a>
          )}
          {linkedinUrl && (
            <button
              onClick={openLinkedIn}
              title="Copies this message and opens their LinkedIn — paste & send"
              className="rounded-lg bg-accent px-2.5 py-1 text-xs font-medium text-white hover:bg-accent-2"
            >
              Open LinkedIn
            </button>
          )}
          <CopyButton text={copyText} />
        </div>
      </div>
      {m.subject && (
        <div className="mb-1 text-sm font-medium">{m.subject}</div>
      )}
      <div className="whitespace-pre-wrap text-sm text-muted">{m.body}</div>
      {sendError && <div className="mt-1.5 text-xs text-hot">{sendError}</div>}
    </div>
  );
}
