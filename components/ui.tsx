import * as React from "react";

// Six small primitives. No component library — just Tailwind + the theme
// tokens from globals.css. Everything is a thin wrapper that forwards props.

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

// ── Card ──────────────────────────────────────────────────────────────────
export function Card({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx(
        "rounded-xl border border-line bg-surface p-4",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

// ── Btn ─────────────────────────────────────────────────────────────────
type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
  size?: "sm" | "md";
};
export function Btn({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: BtnProps) {
  const variants = {
    primary:
      "bg-accent text-white hover:bg-accent-2 disabled:opacity-50",
    ghost:
      "bg-surface-2 text-fg border border-line hover:border-line-2 disabled:opacity-50",
    danger: "bg-hot/15 text-hot border border-hot/40 hover:bg-hot/25",
  };
  const sizes = { sm: "px-2.5 py-1 text-xs", md: "px-3.5 py-2 text-sm" };
  return (
    <button
      className={cx(
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

// ── Input ──────────────────────────────────────────────────────────────
export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...rest }, ref) {
  return (
    <input
      ref={ref}
      className={cx(
        "w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-fg placeholder:text-muted",
        "focus:border-accent focus:outline-none",
        className,
      )}
      {...rest}
    />
  );
});

// ── Select ────────────────────────────────────────────────────────────
export function Select({
  className,
  children,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cx(
        "rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-fg",
        "focus:border-accent focus:outline-none",
        className,
      )}
      {...rest}
    >
      {children}
    </select>
  );
}

// ── Tag ───────────────────────────────────────────────────────────────
type TagTone = "default" | "hot" | "warm" | "cold" | "good" | "accent";
export function Tag({
  tone = "default",
  className,
  children,
}: {
  tone?: TagTone;
  className?: string;
  children: React.ReactNode;
}) {
  const tones: Record<TagTone, string> = {
    default: "bg-surface-2 text-muted border-line",
    hot: "bg-hot/15 text-hot border-hot/30",
    warm: "bg-warm/15 text-warm border-warm/30",
    cold: "bg-cold/15 text-cold border-cold/30",
    good: "bg-good/15 text-good border-good/30",
    accent: "bg-accent/15 text-accent-2 border-accent/30",
  };
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

// ── Table ─────────────────────────────────────────────────────────────
export function Table({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("overflow-x-auto rounded-xl border border-line", className)}>
      <table className="w-full text-left text-sm">{children}</table>
    </div>
  );
}
export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th
      className={cx(
        "border-b border-line bg-surface px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted",
        className,
      )}
    >
      {children}
    </th>
  );
}
export function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cx("border-b border-line/60 px-3 py-2.5", className)}>{children}</td>;
}

export { cx };
