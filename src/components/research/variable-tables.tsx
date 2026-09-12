"use client";

import { MathText } from "@/components/kit/math-text";
import { KindTag, ParamKindTag, Tag, TierTag } from "@/components/kit/tag";
import {
  DEFAULT_PARAMS,
  HOURS_PER_DAY,
  INPUT_RANGES,
  KELVIN_OFFSET,
  M3_PER_BBL,
  MINUTES_PER_DAY,
  PA_S_PER_CP,
  PARAM_INFO,
  PRESET_RANGES,
  VARIABLES,
  type InputRange,
  type ParamKey,
  type VariableKey,
} from "@/lib/physics";
import { formatNumber } from "@/lib/format";
import { useVariableRanges } from "./research-data";
import { formatParam } from "./terms";

// Every variable with its unit, range and source, in three tables: what the
// operator sets, the model constants, and what the model computes.

const TH = "px-3 py-1.5 text-left font-medium whitespace-nowrap";
const TD = "px-3 py-1.5 align-top";

function decimals(step: number): number {
  const text = String(step);
  return text.includes(".") ? text.split(".")[1].length : 0;
}

function Table({ caption, head, children, minWidth }: { caption: string; head: string[]; children: React.ReactNode; minWidth: number }) {
  return (
    <div className="overflow-x-auto rounded-[4px] border border-hairline">
      <table className="w-full text-ui" style={{ minWidth }}>
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-panel text-caption text-ink-muted">
          <tr>
            {head.map((h) => (
              <th key={h} className={TH}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Symbol({ text }: { text: string }) {
  return (
    <td className={`${TD} font-serif text-[15px] whitespace-nowrap text-ink`}>
      <MathText text={text} />
    </td>
  );
}

function InputRow({ id, r, prefix }: { id: string; r: InputRange; prefix?: string }) {
  const d = decimals(r.step);
  return (
    <tr key={id} className="border-t border-hairline">
      <Symbol text={r.symbol} />
      <td className={`${TD} text-ink`}>
        {prefix ? <span className="text-ink-muted">{prefix}: </span> : null}
        {r.name}
      </td>
      <td className={`${TD} text-ink-muted`}>{r.unit}</td>
      <td className={`${TD} whitespace-nowrap tabular-nums text-ink`}>
        {formatNumber(r.min, d)}–{formatNumber(r.max, d)}
      </td>
      <td className={`${TD} tabular-nums text-ink`}>{formatNumber(r.defaultValue, d)}</td>
      <td className={`${TD} whitespace-nowrap tabular-nums text-ink-muted`}>
        {r.fieldRange ? `${formatNumber(r.fieldRange[0], d)}–${formatNumber(r.fieldRange[1], d)}` : "—"}
      </td>
      <td className={TD}>
        <TierTag tier={r.tier} />
      </td>
      <td className={`${TD} text-ink-muted`}>{r.source}</td>
    </tr>
  );
}

function rangeText(key: VariableKey, min: number, max: number): string {
  const digits = VARIABLES[key].digits;
  const fmt = (v: number) => formatNumber(v, Math.abs(v) >= 100 ? 0 : digits);
  return `${fmt(min)} – ${fmt(max)}`;
}

export function VariableTables() {
  const { ranges, error } = useVariableRanges();
  const inputKeys = Object.keys(INPUT_RANGES) as (keyof typeof INPUT_RANGES)[];
  const paramKeys = Object.keys(PARAM_INFO) as ParamKey[];
  const variableKeys = Object.keys(VARIABLES) as VariableKey[];

  return (
    <div className="space-y-10">
      <section aria-labelledby="inputs-heading">
        <h3 id="inputs-heading" className="font-serif text-h4 font-medium text-green">
          Operator inputs
        </h3>
        <p className="mt-1 mb-3 max-w-[68ch] text-ui text-ink-muted">
          What the operator sets in the simulator. The two pump-preset settings apply only when the pump follows the safe speed.
        </p>
        <Table caption="Operator inputs" head={["Symbol", "Input", "Unit", "Range", "Default", "Field practice", "Tier", "Source"]} minWidth={860}>
          {inputKeys.map((key) => (
            <InputRow key={key} id={key} r={INPUT_RANGES[key]} />
          ))}
          {(Object.keys(PRESET_RANGES) as (keyof typeof PRESET_RANGES)[]).map((key) => (
            <InputRow key={key} id={key} r={PRESET_RANGES[key]} prefix="Pump preset" />
          ))}
        </Table>
      </section>

      <section aria-labelledby="params-heading">
        <h3 id="params-heading" className="font-serif text-h4 font-medium text-green">
          Model constants
        </h3>
        <p className="mt-1 mb-3 max-w-[68ch] text-ui text-ink-muted">
          An assumption is our choice and is not fitted to any number. A calibration is set so the model reproduces one documented number.
          Field data must replace both.
        </p>
        <Table
          caption="Model constants"
          head={["Symbol", "Constant", "Value", "Unit", "Tier", "Kind", "Equations", "Source and note"]}
          minWidth={1000}
        >
          {paramKeys.map((key) => {
            const info = PARAM_INFO[key];
            return (
              <tr key={key} className="border-t border-hairline">
                <Symbol text={info.symbol} />
                <td className={`${TD} text-ink`}>{info.name}</td>
                <td className={`${TD} text-right whitespace-nowrap tabular-nums text-ink`}>{formatParam(DEFAULT_PARAMS[key])}</td>
                <td className={`${TD} whitespace-nowrap text-ink-muted`}>{info.unit}</td>
                <td className={TD}>
                  <TierTag tier={info.tier} />
                </td>
                <td className={TD}>
                  <ParamKindTag kind={info.kind} />
                </td>
                <td className={`${TD} whitespace-nowrap`}>
                  {info.equations.map((n, i) => (
                    <span key={n}>
                      {i > 0 ? ", " : ""}
                      <a href={`#equation-${n}`} className="text-green underline-offset-4 hover:underline">
                        {n}
                      </a>
                    </span>
                  ))}
                </td>
                <td className={`${TD} text-ink-muted`}>
                  {info.source}
                  {info.note ? <span className="block text-ink">{info.note}</span> : null}
                </td>
              </tr>
            );
          })}
        </Table>
        <p className="mt-2 text-caption text-ink-muted">
          Conversions: T(K) = T(°C) + {formatNumber(KELVIN_OFFSET, 2)} · 1 cP = {formatNumber(PA_S_PER_CP, 3)} Pa·s · 1 bbl ={" "}
          {formatNumber(M3_PER_BBL, 3)} m³ · {formatNumber(MINUTES_PER_DAY)} minutes and {formatNumber(HOURS_PER_DAY)} hours per day.
        </p>
      </section>

      <section aria-labelledby="computed-heading">
        <h3 id="computed-heading" className="font-serif text-h4 font-medium text-green">
          Computed variables
        </h3>
        <p className="mt-1 mb-3 max-w-[68ch] text-ui text-ink-muted">
          Measured values are what a sensor would read; inferred values only the model can give. The range covers every corner of the
          simulator inputs at a constant pump speed and the longest soak, computed in the background.
        </p>
        <Table caption="Computed variables" head={["Symbol", "Variable", "Unit", "Kind", "Equation", "Range across the inputs"]} minWidth={760}>
          {variableKeys.map((key) => {
            const info = VARIABLES[key];
            const range = ranges?.[key];
            return (
              <tr key={key} className="border-t border-hairline">
                <Symbol text={info.symbol} />
                <td className={`${TD} text-ink`}>{info.name}</td>
                <td className={`${TD} whitespace-nowrap text-ink-muted`}>{info.unit || "—"}</td>
                <td className={TD}>{info.kind === "derived" ? <Tag variant="neutral">Derived</Tag> : <KindTag kind={info.kind} />}</td>
                <td className={TD}>
                  <a href={`#equation-${info.equation}`} className="text-green underline-offset-4 hover:underline">
                    {info.equation}
                  </a>
                </td>
                <td className={`${TD} whitespace-nowrap tabular-nums text-ink`} aria-live="polite">
                  {error ? <span className="text-gold-text">Not available</span> : range ? rangeText(key, range.min, range.max) : <span className="text-ink-muted">Computing…</span>}
                </td>
              </tr>
            );
          })}
        </Table>
      </section>
    </div>
  );
}
