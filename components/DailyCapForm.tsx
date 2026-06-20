"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input, Btn, cx } from "./ui";

// Edits the daily outreach send cap (stored as "daily_send_cap"). The send route
// blocks once this many emails have gone out in a rolling 24h window.
export function DailyCapForm({ initial }: { initial: number }) {
  const router = useRouter();
  const [val, setVal] = useState(String(initial));
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  async function save() {
    const n = Math.max(1, Math.floor(Number(val) || 0)) || 30;
    setVal(String(n));
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ daily_send_cap: n }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        min={1}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        className="w-24 py-1.5 text-sm"
      />
      <span className="text-sm text-muted">emails / 24h</span>
      <Btn size="sm" onClick={save} disabled={pending}>
        Save
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
  );
}
