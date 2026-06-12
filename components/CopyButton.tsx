"use client";

import { useState } from "react";
import { Btn } from "./ui";

// Copy-to-clipboard button with brief "Copied" feedback. Reused by Settings
// (webhook curl) and the Outreach tab (per-message copy).
export function CopyButton({
  text,
  label = "Copy",
  size = "sm",
  variant = "ghost",
}: {
  text: string;
  label?: string;
  size?: "sm" | "md";
  variant?: "primary" | "ghost";
}) {
  const [copied, setCopied] = useState(false);
  return (
    <Btn
      size={size}
      variant={variant}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        } catch {
          setCopied(false);
        }
      }}
    >
      {copied ? "Copied ✓" : label}
    </Btn>
  );
}
