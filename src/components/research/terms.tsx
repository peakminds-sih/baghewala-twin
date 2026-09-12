import { KindTag, ParamKindTag, Tag, TierTag } from "@/components/kit/tag";
import { MathText } from "@/components/kit/math-text";
import { DEFAULT_PARAMS, INPUT_RANGES, PARAM_INFO, VARIABLES } from "@/lib/physics";
import { formatNumber } from "@/lib/format";
import type { Term } from "@/lib/research/relationships";

// Shared display helpers for inputs, parameters and computed variables.

/** A parameter value with as many decimals as it was written with (0.04445). */
export function formatParam(value: number): string {
  const text = String(value);
  const dot = text.indexOf(".");
  return formatNumber(value, dot === -1 ? 0 : Math.min(6, text.length - dot - 1));
}

export interface TermInfo {
  key: string;
  symbol: string;
  name: string;
  unit: string;
  value: string;
  tags: React.ReactNode;
}

export function termInfo(term: Term): TermInfo {
  switch (term.kind) {
    case "input": {
      const r = INPUT_RANGES[term.key];
      const digits = String(r.step).includes(".") ? String(r.step).split(".")[1].length : 0;
      return {
        key: `input-${term.key}`,
        symbol: r.symbol,
        name: r.name,
        unit: r.unit,
        value: `${formatNumber(r.min, digits)}–${formatNumber(r.max, digits)}, default ${formatNumber(r.defaultValue, digits)}`,
        tags: (
          <>
            <Tag variant="neutral">Input</Tag>
            <TierTag tier={r.tier} />
          </>
        ),
      };
    }
    case "param": {
      const info = PARAM_INFO[term.key];
      return {
        key: `param-${term.key}`,
        symbol: info.symbol,
        name: info.name,
        unit: info.unit,
        value: formatParam(DEFAULT_PARAMS[term.key]),
        tags: (
          <>
            <TierTag tier={info.tier} />
            <ParamKindTag kind={info.kind} />
          </>
        ),
      };
    }
    case "variable": {
      const info = VARIABLES[term.key];
      return {
        key: `variable-${term.key}`,
        symbol: info.symbol,
        name: info.name,
        unit: info.unit,
        value: `Computed, equation ${info.equation}`,
        tags: info.kind === "derived" ? <Tag variant="neutral">Derived</Tag> : <KindTag kind={info.kind} />,
      };
    }
    case "time":
      return {
        key: "time",
        symbol: "t",
        name: "Day in the cycle",
        unit: "days",
        value: "Counts through each phase",
        tags: <Tag variant="neutral">Time</Tag>,
      };
  }
}

/** The variables a relationship involves, as a compact table. */
export function TermTable({ terms }: { terms: Term[] }) {
  const rows = terms.map(termInfo);
  return (
    <div className="overflow-x-auto rounded-[4px] border border-hairline">
      <table className="w-full min-w-[420px] text-ui">
        <thead className="bg-panel text-caption text-ink-muted">
          <tr>
            <th className="px-3 py-1.5 text-left font-medium">Symbol</th>
            <th className="px-3 py-1.5 text-left font-medium">Variable</th>
            <th className="px-3 py-1.5 text-left font-medium">Value</th>
            <th className="px-3 py-1.5 text-left font-medium">Source</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-t border-hairline align-top">
              <td className="px-3 py-1.5 font-serif text-[15px] whitespace-nowrap text-ink">
                <MathText text={row.symbol} />
              </td>
              <td className="px-3 py-1.5 text-ink">{row.name}</td>
              <td className="px-3 py-1.5 tabular-nums text-ink">
                {row.value}
                {row.unit && row.unit !== "fraction" && row.unit !== "—" ? <span className="text-ink-muted"> {row.unit}</span> : null}
              </td>
              <td className="px-3 py-1.5">
                <span className="flex flex-wrap gap-1">{row.tags}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
