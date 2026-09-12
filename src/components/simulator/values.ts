// Reads one value for one day out of a cycle result, and names the equation
// that produced it. The readouts and the equation chain share these.

import {
  INPUT_RANGES,
  VARIABLES,
  pumpCapacity,
  steamEnthalpy,
  type CycleResult,
  type DayState,
  type EquationId,
  type EquationTerm,
  type InputKey,
  type VariableKey,
} from "@/lib/physics";
import { formatNumber } from "@/lib/format";

export function variableValue(key: VariableKey, day: DayState, result: CycleResult): number | null {
  const { measured, inferred } = day;
  switch (key) {
    case "steamEnthalpy":
      return steamEnthalpy(result.config.steamQuality, result.params);
    case "heatedVolumeM3":
      return inferred.heatedVolumeM3;
    case "heatedRadiusM":
      return inferred.heatedRadiusM;
    case "tauDays":
      return result.summary.tauDays;
    case "reservoirTempC":
      return inferred.reservoirTempC;
    case "viscosityCp":
      return inferred.viscosityCp;
    case "inflowRateBblD":
      return inferred.inflowRateBblD;
    case "pumpCapacityBblD":
      return measured.pumpSpeedSPM > 0 ? pumpCapacity(measured.strokeM, measured.pumpSpeedSPM, result.params) : 0;
    case "flowRateBblD":
      return measured.flowRateBblD;
    case "safePumpSpeedSPM":
      return inferred.safePumpSpeedSPM;
    case "floatingRisk":
      return inferred.floatingRisk;
    case "wellheadTempC":
      return measured.wellheadTempC;
    case "pumpLoadKN":
      return measured.pumpLoadKN;
    case "injectionDays":
      return result.summary.injectionDays;
    case "daysSinceSteaming":
      return measured.daysSinceSteaming;
    case "cumulativeOilBbl":
      return result.summary.cumulativeOilBbl;
    case "steamOilRatio":
      return result.summary.steamOilRatio;
  }
}

/** An operator input on this day. The pump speed is the day's set speed. */
export function inputValue(key: InputKey, day: DayState, result: CycleResult): number | null {
  if (key === "pumpSpeedSPM") return day.measured.pumpSpeedSPM;
  const value = result.config[key];
  return typeof value === "number" ? value : null;
}

/** Viscosity spans 5 to 11,500 cP, so it drops decimals once it is large. */
export function digitsFor(key: VariableKey, value: number | null): number {
  if (key === "viscosityCp") return value !== null && value < 100 ? 1 : 0;
  return VARIABLES[key].digits;
}

/** Before production, temperature and zone size come from equation 7. */
export function producingEquation(key: VariableKey, day: DayState): EquationId {
  if ((key === "reservoirTempC" || key === "heatedVolumeM3" || key === "heatedRadiusM") && day.phase !== "production") {
    return 7;
  }
  return VARIABLES[key].equation;
}

export interface TermView {
  id: string;
  variable: VariableKey | null;
  name: string;
  symbol: string;
  unit: string;
  text: string;
}

/** A readable name, symbol and value for one equation input on this day. */
export function termView(term: EquationTerm, day: DayState, result: CycleResult): TermView {
  if (term.kind === "time") {
    return {
      id: "time",
      variable: null,
      name: `Day in the ${day.phase} phase`,
      symbol: "t",
      unit: "days",
      text: formatNumber(day.phaseDay, 0),
    };
  }
  if (term.kind === "input") {
    const range = INPUT_RANGES[term.key];
    const value = inputValue(term.key, day, result);
    const digits = String(range.step).includes(".") ? String(range.step).split(".")[1].length : 0;
    return {
      id: `input-${term.key}`,
      variable: null,
      name: term.key === "pumpSpeedSPM" ? "Set pump speed" : range.name,
      symbol: range.symbol,
      unit: range.unit,
      text: value === null ? "—" : formatNumber(value, term.key === "pumpSpeedSPM" ? 2 : digits),
    };
  }
  return variableView(term.key, day, result);
}

export function variableView(key: VariableKey, day: DayState, result: CycleResult): TermView {
  const info = VARIABLES[key];
  const value = variableValue(key, day, result);
  return {
    id: `var-${key}`,
    variable: key,
    name: info.name,
    symbol: info.symbol,
    unit: info.unit,
    text: value === null ? "—" : formatNumber(value, digitsFor(key, value)),
  };
}

/** "Day 42", with one decimal when the day falls between whole days. */
export function formatDay(t: number): string {
  return `Day ${formatNumber(t, Number.isInteger(Math.round(t * 10) / 10) ? 0 : 1)}`;
}
