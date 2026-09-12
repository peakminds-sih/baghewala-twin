import { KIND_INFO, TIER_INFO, type ParamKind, type Tier } from "@/lib/physics";
import { cn } from "@/lib/utils";

// Small labels (DESIGN.md §5.7). Every tag carries a word, so colour is
// never the only signal.

export type TagVariant = "measured" | "inferred" | "A" | "B" | "D" | "std" | "neutral";

const VARIANT_CLASS: Record<TagVariant, string> = {
  measured: "border-ink text-ink",
  inferred: "border-green text-green",
  A: "border-green bg-green text-on-green",
  B: "border-green text-green",
  D: "border-gold text-gold-text",
  std: "border-hairline-strong text-ink-muted",
  neutral: "border-hairline-strong text-ink-muted",
};

export function Tag({
  variant,
  title,
  className,
  children,
}: {
  variant: TagVariant;
  title?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex shrink-0 items-center rounded-[4px] border px-1.5 py-px text-overline font-semibold uppercase",
        VARIANT_CLASS[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function TierTag({ tier, className }: { tier: Tier; className?: string }) {
  const info = TIER_INFO[tier];
  return (
    <Tag variant={tier} title={info.description} className={className}>
      {info.label}
    </Tag>
  );
}

export function KindTag({ kind, className }: { kind: "measured" | "inferred"; className?: string }) {
  return (
    <Tag
      variant={kind}
      className={className}
      title={kind === "measured" ? "A sensor or the operator can read this." : "Only the model can give this. No sensor reads it."}
    >
      {kind === "measured" ? "Measured" : "Inferred"}
    </Tag>
  );
}

export function ParamKindTag({ kind, className }: { kind: ParamKind; className?: string }) {
  const info = KIND_INFO[kind];
  return (
    <Tag variant={kind === "assumption" || kind === "calibration" ? "D" : "neutral"} title={info.description} className={className}>
      {info.label}
    </Tag>
  );
}
