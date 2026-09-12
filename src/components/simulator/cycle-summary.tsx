import { VARIABLES, type CycleResult } from "@/lib/physics";
import { Panel } from "@/components/kit/panel";
import { MathText } from "@/components/kit/math-text";
import { formatNumber } from "@/lib/format";

// Totals and key days for the whole cycle.

function dayText(day: number | null, productionDays: number, digits: number): string {
  if (day === null) return "Not in this cycle";
  const text = `Production day ${formatNumber(day, digits)}`;
  return day > productionDays ? `${text}, past the end of the cycle` : text;
}

export function CycleSummary({ result }: { result: CycleResult }) {
  const s = result.summary;
  const v = VARIABLES;
  const rows: { label: string; symbol?: string; value: string; note?: string }[] = [
    { label: v.cumulativeOilBbl.name, symbol: v.cumulativeOilBbl.symbol, value: `${formatNumber(s.cumulativeOilBbl, 0)} bbl`, note: "Eq 4, trapezoid rule over the production days" },
    { label: v.steamOilRatio.name, symbol: v.steamOilRatio.symbol, value: formatNumber(s.steamOilRatio, 2), note: `Steam ${formatNumber(s.steamBbl, 0)} bbl, cold-water equivalent` },
    { label: v.heatedVolumeM3.name, symbol: v.heatedVolumeM3.symbol, value: `${formatNumber(s.heatedVolumeM3, 0)} m³`, note: `Radius ${formatNumber(s.heatedRadiusM, 1)} m, Eq 1` },
    { label: v.tauDays.name, symbol: v.tauDays.symbol, value: `${formatNumber(s.tauDays, 1)} days`, note: "Eq 2" },
    { label: v.injectionDays.name, symbol: v.injectionDays.symbol, value: `${formatNumber(s.injectionDays, 1)} days`, note: "Eq 7, at the field steam rate" },
    {
      label: "The safe-speed limit starts to bind",
      value: dayText(s.limitBindsDay, result.config.productionDays, 1),
      note: "Eq 5. The day the safe speed first falls below the mechanical ceiling. It does not depend on the set speed.",
    },
    {
      label: "The rods start to float",
      value: s.floatingStartsDay === null ? "Not in this cycle" : `Production day ${s.floatingStartsDay}`,
      note: "Eq 5. The first whole day with floating risk above 1.",
    },
  ];

  return (
    <Panel title="Cycle summary">
      <dl className="divide-y divide-hairline">
        {rows.map((row) => (
          <div key={row.label} className="grid gap-1 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-4">
            <dt className="text-ui text-ink">
              {row.label}
              {row.symbol ? <MathText text={row.symbol} className="ml-1.5 font-serif text-ink-muted" /> : null}
              {row.note ? <span className="block text-caption text-ink-muted">{row.note}</span> : null}
            </dt>
            <dd className="text-ui font-semibold tabular-nums text-ink sm:text-right">{row.value}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}
