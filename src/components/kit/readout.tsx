import { TriangleAlert } from "lucide-react";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { KindTag } from "./tag";

// A live value (DESIGN.md §5.9). Values update at once while inputs move: a
// counting animation would lag behind the slider. Status uses gold plus a
// word, never colour alone (§2.4). The critical fill fades in over 240 ms.

export type ReadoutStatus = "normal" | "caution" | "critical";

export function Readout({
  label,
  value,
  unit,
  digits,
  kind,
  source,
  status = "normal",
  statusText,
  className,
}: {
  label: string;
  value: number | null;
  unit?: string;
  digits: number;
  kind?: "measured" | "inferred";
  /** Which equation produced the value, for example "Eq 5". */
  source?: React.ReactNode;
  status?: ReadoutStatus;
  statusText?: string;
  className?: string;
}) {
  const critical = status === "critical";
  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition-[background-color,border-color] duration-[240ms] ease-out",
        critical ? "border-gold bg-gold" : status === "caution" ? "border-gold bg-panel" : "border-hairline bg-panel",
        className,
      )}
    >
      {/* On a narrow tile the tag wraps under the label instead of squeezing it. */}
      <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
        <span className={cn("text-caption", critical ? "text-on-gold" : "text-ink-muted")}>{label}</span>
        {kind ? <KindTag kind={kind} className={critical ? "border-on-gold text-on-gold" : undefined} /> : null}
      </div>
      <p className="mt-2 flex items-baseline gap-1.5">
        <span className={cn("text-readout font-medium tabular-nums", critical ? "text-on-gold" : "text-ink")}>
          {value === null ? "—" : formatNumber(value, digits)}
        </span>
        {unit ? <span className={cn("text-ui", critical ? "text-on-gold" : "text-ink-muted")}>{unit}</span> : null}
      </p>
      {statusText ? (
        <p
          className={cn(
            "mt-1 flex items-center gap-1 text-caption font-semibold",
            critical ? "text-on-gold" : "text-gold-text",
          )}
        >
          <TriangleAlert className="size-3.5" aria-hidden="true" />
          {statusText}
        </p>
      ) : null}
      {source ? <div className={cn("mt-2 text-caption", critical ? "text-on-gold" : "text-ink-muted")}>{source}</div> : null}
    </div>
  );
}
