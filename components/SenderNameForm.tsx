"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input, Btn, cx } from "./ui";

// Edits the sender name injected into every generated outreach sequence so emails
// sign off consistently (no more AI-invented names). Persists to the "sender_name"
// setting via /api/settings, then refreshes server components so prompts pick it up.
export function SenderNameForm({ initial }: { initial: string }) {
  const router = useRouter();
  const [name, setName] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  async function save() {
    const next = name.trim() || "Jessie";
    setName(next);
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sender_name: next }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
    startTransition(() => router.refresh());
  }

  return (
    <div className="mt-3 flex items-center gap-2">
      <Input
        value={name}
        placeholder="Jessie"
        onChange={(e) => setName(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        className="w-48 py-1.5 text-sm"
      />
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
