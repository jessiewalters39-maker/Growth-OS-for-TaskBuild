"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { INDUSTRIES } from "@/lib/constants";
import { Select, Input, cx } from "./ui";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/leads", label: "Lead Center" },
  { href: "/cmo", label: "AI CMO" },
  { href: "/settings", label: "Settings" },
];

export function TopBar({
  industry,
  location,
}: {
  industry: string;
  location: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [ind, setInd] = useState(industry);
  const [loc, setLoc] = useState(location);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  async function save(next: { industry?: string; location?: string }) {
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
    // Re-fetch server components so prompts/pages see the new mode.
    startTransition(() => router.refresh());
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-accent text-sm text-white">
            T
          </span>
          <span className="hidden sm:inline">Growth OS</span>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cx(
                  "rounded-lg px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-surface-2 text-fg"
                    : "text-muted hover:text-fg",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden text-xs text-muted md:inline">Mode</span>
          <Select
            value={ind}
            onChange={(e) => {
              setInd(e.target.value);
              save({ industry: e.target.value });
            }}
            className="py-1.5 text-xs"
          >
            {INDUSTRIES.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </Select>
          <Input
            value={loc}
            placeholder="Tyler TX"
            onChange={(e) => setLoc(e.target.value)}
            onBlur={() => save({ location: loc })}
            className="w-28 py-1.5 text-xs"
          />
          <span
            className={cx(
              "text-xs text-good transition-opacity",
              saved || pending ? "opacity-100" : "opacity-0",
            )}
          >
            saved
          </span>
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="rounded-lg px-2.5 py-1.5 text-sm text-muted hover:text-fg"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
