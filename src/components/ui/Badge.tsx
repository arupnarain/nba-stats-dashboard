import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "accent" | "positive" | "warn" | "danger";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-2 text-muted border-line",
  accent: "bg-accent/15 text-accent border-accent/30",
  positive: "bg-positive/15 text-positive border-positive/30",
  warn: "bg-warn/15 text-warn border-warn/30",
  danger: "bg-danger/15 text-danger border-danger/30",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

/** Map an injury status string to a sensible badge tone. */
export function injuryTone(status: string): Tone {
  const s = status.toLowerCase();
  if (s.includes("out")) return "danger";
  if (s.includes("doubtful")) return "danger";
  if (s.includes("question") || s.includes("game time")) return "warn";
  if (s.includes("day")) return "warn";
  return "neutral";
}
