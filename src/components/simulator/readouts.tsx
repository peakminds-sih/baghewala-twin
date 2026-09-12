"use client";

import { VARIABLES, type CycleResult, type DayState, type VariableKey } from "@/lib/physics";
import { Readout, type ReadoutStatus } from "@/components/kit/readout";
import { KindTag } from "@/components/kit/tag";
import { formatNumber } from "@/lib/format";
import { digitsFor, producingEquation, variableValue } from "./values";

// The current day's values, split the same way as the model's types:
// measured (a sensor or the operator reads it) and inferred (only the model
// gives it). Hovering a tile highlights its equation in the chain below.

const MEASURED: VariableKey[] = ["wellheadTempC", "pumpLoadKN", "flowRateBblD", "daysSinceSteaming"];
const INFERRED: VariableKey[] = [
  "reservoirTempC",
  "viscosityCp",
  "heatedVolumeM3",
  "heatedRadiusM",
  "safePumpSpeedSPM",
  "floatingRisk",
];

function riskStatus(risk: number): { status: ReadoutStatus; text?: string } {
  if (risk > 1) return { status: "critical", text: "Rod floating" };
  if (risk >= 0.8) return { status: "caution", text: "Caution" };
  return { status: "normal" };
}

export function DayReadouts({
  day,
  result,
  onHighlight,
}: {
  day: DayState;
  result: CycleResult;
  onHighlight: (key: VariableKey | null) => void;
}) {
  const tile = (key: VariableKey, kind: "measured" | "inferred") => {
    const info = VARIABLES[key];
    const value = variableValue(key, day, result);
    const risk = key === "floatingRisk" ? riskStatus(day.inferred.floatingRisk) : { status: "normal" as const };
    const shutIn = kind === "measured" && value === null;
    return (
      <div key={key} onMouseEnter={() => onHighlight(key)} onMouseLeave={() => onHighlight(null)}>
        <Readout
          label={info.name}
          value={value}
          unit={info.unit}
          digits={digitsFor(key, value)}
          kind={kind}
          status={risk.status}
          statusText={risk.text}
          source={shutIn ? "Well shut in, no reading" : `Eq ${producingEquation(key, day)}`}
          className="h-full"
        />
      </div>
    );
  };

  // The operator's own settings are measured too: they are read, not inferred.
  const setting = (label: string, value: number, unit: string, digits: number, source: string) => (
    <Readout key={label} label={label} value={value} unit={unit} digits={digits} kind="measured" source={source} className="h-full" />
  );

  return (
    <div className="space-y-8">
      <section aria-labelledby="sim-measured">
        <div className="mb-3 flex items-center gap-2">
          <h3 id="sim-measured" className="font-serif text-h4 font-medium text-green">
            Measured
          </h3>
          <KindTag kind="measured" />
        </div>
        <p className="mb-4 text-caption text-ink-muted">A sensor or the operator can read these at the well.</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {MEASURED.map((key) => tile(key, "measured"))}
          {setting("Set pump speed", day.measured.pumpSpeedSPM, "SPM", 2, day.phase === "production" ? "Operator setting" : "Pump off")}
          {setting("Stroke length", day.measured.strokeM, "m", 1, "Operator setting")}
        </div>
      </section>
      <section aria-labelledby="sim-inferred">
        <div className="mb-3 flex items-center gap-2">
          <h3 id="sim-inferred" className="font-serif text-h4 font-medium text-green">
            Inferred
          </h3>
          <KindTag kind="inferred" />
        </div>
        <p className="mb-4 text-caption text-ink-muted">
          Only the model gives these. No sensor reads them. Risk above {formatNumber(1, 1)} means the rods float.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {INFERRED.map((key) => tile(key, "inferred"))}
        </div>
      </section>
    </div>
  );
}
