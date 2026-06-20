"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input, Btn, cx } from "./ui";

// Edits the booking + website links injected into every generated sequence.
// The booking URL becomes the call-to-action; the website is referenced for
// credibility. Persisted as "booking_url" / "website_url" via /api/settings.
export function OutreachLinksForm({
  booking,
  website,
}: {
  booking: string;
  website: string;
}) {
  const router = useRouter();
  const [b, setB] = useState(booking);
  const [w, setW] = useState(website);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  async function save() {
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ booking_url: b.trim(), website_url: w.trim() }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-2">
      <label className="block">
        <span className="text-xs text-muted">Booking link (the CTA)</span>
        <Input
          value={b}
          placeholder="https://cal.com/your-handle/15min"
          onChange={(e) => setB(e.target.value)}
          onBlur={save}
          className="mt-1 text-sm"
        />
      </label>
      <label className="block">
        <span className="text-xs text-muted">Website</span>
        <Input
          value={w}
          placeholder="https://www.taskbuildai.com"
          onChange={(e) => setW(e.target.value)}
          onBlur={save}
          className="mt-1 text-sm"
        />
      </label>
      <div className="flex items-center gap-2">
        <Btn size="sm" onClick={save} disabled={pending}>
          Save links
        </Btn>
        <span
          className={cx(
            "text-xs text-good transition-opacity",
            saved || pending ? "opacity-100" : "opacity-0",
          )}
        >
          saved
        </span>
      </div>
    </div>
  );
}
