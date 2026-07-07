"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Btn, cx } from "./ui";

// Edits the plain-text signature appended to the bottom of every outreach email
// on send. Persists to the "signature" setting via /api/settings. Multi-line —
// Gmail's own signature can't apply to SMTP mail, so this is where the founder's
// sign-off (name, company, cal.com booking link) lives.
export function SignatureForm({ initial }: { initial: string }) {
  const router = useRouter();
  const [text, setText] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  async function save() {
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signature: text }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
    startTransition(() => router.refresh());
  }

  return (
    <div className="mt-3">
      <textarea
        value={text}
        rows={4}
        placeholder={"Jessie\nTaskBuildAI\nBook a 15-min audit: https://cal.com/…"}
        onChange={(e) => setText(e.target.value)}
        onBlur={save}
        className={cx(
          "w-full resize-y rounded-lg border border-line bg-surface-2 px-3 py-2",
          "font-mono text-sm leading-relaxed text-fg placeholder:text-muted",
          "focus:border-accent focus:outline-none",
        )}
      />
      <div className="mt-2 flex items-center gap-2">
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
        <span className="ml-auto text-xs text-muted">
          Appended to every outreach email, below the sign-off.
        </span>
      </div>
    </div>
  );
}
