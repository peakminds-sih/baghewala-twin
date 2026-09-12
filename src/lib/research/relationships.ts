// Relationships between the model's variables, for the research page.
// Rebuilt from docs/variable-relationships.html, sections 3 to 7, plus one
// relationship for pump schedules. Every number in a graph or a fact comes
// from the physics module at run time; nothing is copied from the document.
// Pure TypeScript: no React.
//
// A relationship is either "direct" (a few function calls, cheap enough for
// the main thread) or "sweep" (full cycles, run in the Web Worker).

import { formatNumber as f } from "@/lib/format";
import {
  PARAM_INFO,
  DEFAULT_PARAMS,
  INPUT_RANGES,
  PRESET_RANGES,
  REFERENCE_CASE,
  coolingTimeConstant,
  floatConstant,
  heatedZone,
  inflowCeilingRatio,
  inflowRate,
  productionDayAtSafeSpeed,
  productionTemperature,
  pumpCapacity,
  safePumpSpeed,
  steamEnthalpy,
  tauInfinity,
  temperatureAtViscosity,
  viscosityCp,
  withParams,
  type CycleResult,
  type EquationId,
  type InputKey,
  type ModelParams,
  type ParamKey,
  type SerializableWellConfig,
  type SweepPoint,
  type SweepTarget,
  type VariableKey,
} from "@/lib/physics";

// ---------------------------------------------------------------- types

export type GraphRole = "main" | "measured" | "limit" | "comparison";

export interface GraphPoint {
  x: number;
  y: number | null;
}

export interface GraphSeries {
  id: string;
  label: string;
  role: GraphRole;
  points: GraphPoint[];
  unit?: string;
  digits?: number;
  opacity?: number;
  step?: boolean;
}

export interface GraphAxis {
  label: string;
  scale?: "linear" | "log";
  min?: number;
  max?: number;
  ticks?: number[];
  format?: (value: number) => string;
}

export interface Graph {
  title: string;
  subtitle?: string;
  x: GraphAxis;
  y: GraphAxis;
  series: GraphSeries[];
  areas?: { id: string; label: string; lower: GraphPoint[]; upper: GraphPoint[] }[];
  rules?: { y: number; label: string; align?: "left" | "right" }[];
  bands?: { from: number; to: number; label?: string; tone: "gold" | "green" | "risk" }[];
  marker?: { x: number; label?: string } | null;
  formatX?: (x: number) => string;
}

/** A graph plus the plain sentences that read its numbers. */
export interface Outcome {
  graph: Graph;
  facts: string[];
}

export interface SweepJob {
  base: SerializableWellConfig;
  target: SweepTarget;
  values: number[];
  params?: ModelParams;
}

export type Compute =
  | { kind: "direct"; run: () => Outcome }
  | { kind: "sweep"; jobs: SweepJob[]; build: (results: SweepPoint[][]) => Outcome };

export type Term =
  | { kind: "input"; key: InputKey }
  | { kind: "param"; key: ParamKey }
  | { kind: "variable"; key: VariableKey }
  | { kind: "time" };

export type GroupId = "steam" | "time" | "viscosity" | "consequences" | "totals" | "schedule";

export const GROUPS: Record<GroupId, string> = {
  steam: "Steam inputs → heated zone and duration",
  time: "Duration and time → temperature",
  viscosity: "Temperature → viscosity",
  consequences: "Viscosity → the two consequences",
  totals: "Everything → cumulative oil and SOR",
  schedule: "Pump schedule → rod floating",
};

export interface Relationship {
  id: string;
  group: GroupId;
  /** Plain text with "_" subscripts, rendered by MathText. */
  from: string;
  to: string;
  /** The shape tag from the variable-relationships document. */
  shape: string;
  summary: string;
  equations: EquationId[];
  terms: Term[];
  compute: Compute;
}

// ---------------------------------------------------------------- helpers

const P = DEFAULT_PARAMS;
/** The worked case's pump speed. REFERENCE_CASE holds a number; the check narrows the type. */
const WORKED_SPEED =
  typeof REFERENCE_CASE.pumpSpeedSPM === "number" ? REFERENCE_CASE.pumpSpeedSPM : INPUT_RANGES.pumpSpeedSPM.defaultValue;
const BASE: SerializableWellConfig = { ...REFERENCE_CASE, pumpSpeedSPM: WORKED_SPEED };
const VS = INPUT_RANGES.steamVolumeM3;
const QUALITY = INPUT_RANGES.steamQuality;
const STROKE = INPUT_RANGES.strokeM;
const SPEED = INPUT_RANGES.pumpSpeedSPM;
const CYCLE = INPUT_RANGES.productionDays;

/** The range the documents give for a model parameter (PARAM_INFO.range). */
function studyRange(key: ParamKey): readonly [number, number] {
  const range = PARAM_INFO[key].range;
  if (!range) throw new Error(`The physics module gives no documented range for ${key}.`);
  return range;
}

/** Documented ranges for the three parameters studied here. [Not model values] */
const STUDY_RANGES = {
  thermalEfficiency: studyRange("thermalEfficiency"),
  steamTempC: studyRange("steamTempC"),
  waltherB: studyRange("waltherB"),
};

/** Opacity steps for several cases of one variable in one hue (DESIGN.md §6.2). */
const TINTS = [1, 0.7, 0.45, 0.25] as const;

function steps(start: number, end: number, step: number): number[] {
  const out: number[] = [];
  for (let v = start; v <= end + step * 1e-6; v += step) out.push(Number(v.toFixed(6)));
  return out;
}

const zoneAt = (steamVolumeM3: number, p: ModelParams = P, quality = REFERENCE_CASE.steamQuality) =>
  heatedZone(steamVolumeM3, quality, p);
const tauAt = (steamVolumeM3: number) => coolingTimeConstant(zoneAt(steamVolumeM3).radiusM);
const WORKED_TAU = tauAt(REFERENCE_CASE.steamVolumeM3);
const WORKED_RADIUS = zoneAt(REFERENCE_CASE.steamVolumeM3).radiusM;

/** The safe speed on a production day of the worked case. */
const safeSpeedOnDay = (day: number, strokeM: number = REFERENCE_CASE.strokeM, p: ModelParams = P) =>
  safePumpSpeed(viscosityCp(productionTemperature(day, WORKED_TAU, p), p), strokeM, p);

const productionDays = (result: CycleResult) => result.days.filter((d) => d.phase === "production");

function resultAt(points: SweepPoint[], value: number): CycleResult {
  const hit = points.find((p) => Math.abs(p.value - value) < 1e-9);
  if (!hit) throw new Error(`No sweep result at ${value}.`);
  return hit.result;
}

/** One cycle, in the worker, as a one-value sweep. */
function single(base: SerializableWellConfig): SweepJob {
  return {
    base,
    target: { kind: "input", key: "productionDays" },
    values: [base.productionDays ?? CYCLE.defaultValue],
  };
}

const dayLabel = (x: number) => `Production day ${f(x, 0)}`;
const volumeLabel = (x: number) => `${f(x, 0)} m³ of steam`;

// Shared sweeps. The same job object gives the same cache key, so two
// relationships that read one sweep run it once.
const VOLUME_SWEEP: SweepJob = { base: BASE, target: { kind: "input", key: "steamVolumeM3" }, values: steps(VS.min, VS.max, 250) };

// ---------------------------------------------------------------- the list

export const RELATIONSHIPS: Relationship[] = [
  {
    id: "steam-volume-heated-volume",
    group: "steam",
    from: "Steam volume V_s",
    to: "Heated zone volume V_h",
    shape: "Linear",
    summary: "Twice the steam heats twice the rock, when steam temperature, quality and efficiency stay fixed.",
    equations: [1],
    terms: [
      { kind: "input", key: "steamVolumeM3" },
      { kind: "variable", key: "heatedVolumeM3" },
      { kind: "param", key: "thermalEfficiency" },
      { kind: "param", key: "rockHeatCapacity" },
    ],
    compute: {
      kind: "direct",
      run: () => {
        const perM3 = zoneAt(VS.defaultValue).volumeM3 / VS.defaultValue;
        return {
          graph: {
            title: "Heated volume grows in step with steam",
            x: { label: "Steam volume (m³)" },
            y: { label: "Heated zone volume (m³)", min: 0 },
            series: [
              {
                id: "vh",
                label: "Heated volume",
                role: "main",
                unit: "m³",
                digits: 0,
                points: steps(VS.min, VS.max, VS.step).map((x) => ({ x, y: zoneAt(x).volumeM3 })),
              },
            ],
            marker: { x: VS.defaultValue, label: "Default" },
            formatX: volumeLabel,
          },
          facts: [
            `${f(zoneAt(VS.min).volumeM3)} m³ of rock at ${f(VS.min)} m³ of steam, ${f(zoneAt(VS.defaultValue).volumeM3)} m³ at ${f(VS.defaultValue)} m³, and ${f(zoneAt(VS.max).volumeM3)} m³ at ${f(VS.max)} m³.`,
            `Each cubic metre of steam heats ${f(perM3, 2)} m³ of rock, at every volume.`,
          ],
        };
      },
    },
  },
  {
    id: "steam-volume-heated-radius",
    group: "steam",
    from: "Steam volume V_s",
    to: "Heated zone radius r_h",
    shape: "Square root",
    summary: "The radius grows as the square root of the volume. Steam buys duration more than it buys distance.",
    equations: [1],
    terms: [
      { kind: "input", key: "steamVolumeM3" },
      { kind: "variable", key: "heatedRadiusM" },
      { kind: "param", key: "netThicknessM" },
    ],
    compute: {
      kind: "direct",
      run: () => {
        const ratio = zoneAt(VS.max).radiusM / zoneAt(VS.max / 4).radiusM;
        return {
          graph: {
            title: "Reach grows slower and slower",
            x: { label: "Steam volume (m³)" },
            y: { label: "Heated zone radius (m)", min: 0 },
            series: [
              {
                id: "rh",
                label: "Heated radius",
                role: "main",
                unit: "m",
                digits: 1,
                points: steps(VS.min, VS.max, VS.step).map((x) => ({ x, y: zoneAt(x).radiusM })),
              },
            ],
            marker: { x: VS.defaultValue, label: "Default" },
            formatX: volumeLabel,
          },
          facts: [
            `The radius is ${f(zoneAt(VS.min).radiusM, 1)} m at ${f(VS.min)} m³, ${f(zoneAt(VS.defaultValue).radiusM, 1)} m at ${f(VS.defaultValue)} m³ and ${f(zoneAt(VS.max).radiusM, 1)} m at ${f(VS.max)} m³.`,
            `Four times the steam (${f(VS.max / 4)} to ${f(VS.max)} m³) reaches only ${f(ratio, 2)} times as far.`,
          ],
        };
      },
    },
  },
  {
    id: "steam-volume-tau",
    group: "steam",
    from: "Steam volume V_s",
    to: "Cooling constant τ",
    shape: "Square root, then levels off",
    summary:
      "A bigger zone has less cold surface for its size, so it holds heat longer. τ rises quickly at first, then levels off. There is no hard cap.",
    equations: [1, 2],
    terms: [
      { kind: "input", key: "steamVolumeM3" },
      { kind: "variable", key: "heatedRadiusM" },
      { kind: "variable", key: "tauDays" },
      { kind: "param", key: "tauRefDays" },
      { kind: "param", key: "netThicknessM" },
    ],
    compute: {
      kind: "direct",
      run: () => {
        const tauInf = tauInfinity();
        const far = VS.max * 3;
        return {
          graph: {
            title: "τ rises, then levels off",
            subtitle: "Shown to three times the simulator maximum, so the levelling is visible.",
            x: { label: "Steam volume (m³)" },
            y: { label: "Cooling constant τ (days)", min: 0 },
            series: [
              {
                id: "tau",
                label: "τ",
                role: "main",
                unit: "days",
                digits: 1,
                points: steps(VS.min, far, 100).map((x) => ({ x, y: tauAt(x) })),
              },
            ],
            rules: [{ y: tauInf, label: `τ∞ = ${f(tauInf, 1)} days` }],
            bands: [{ from: VS.min, to: VS.max, tone: "green", label: "Simulator range" }],
            formatX: volumeLabel,
          },
          facts: [
            `τ is ${f(tauAt(VS.min), 1)} days at ${f(VS.min)} m³, ${f(tauAt(VS.defaultValue), 1)} days at ${f(VS.defaultValue)} m³ and ${f(tauAt(VS.max), 1)} days at ${f(VS.max)} m³.`,
            `It levels off towards τ∞ = ${f(tauInf, 1)} days. At ${f(far)} m³ it is still only ${f(tauAt(far), 1)} days.`,
          ],
        };
      },
    },
  },
  {
    id: "quality-heated-zone",
    group: "steam",
    from: "Steam quality x",
    to: "Heated zone V_h and τ",
    shape: "Near-linear",
    summary:
      "Wetter steam carries less latent heat, so it heats less rock. The effect is real, but weaker than the effect of steam volume.",
    equations: [1, 2],
    terms: [
      { kind: "input", key: "steamQuality" },
      { kind: "variable", key: "steamEnthalpy" },
      { kind: "variable", key: "heatedVolumeM3" },
      { kind: "variable", key: "tauDays" },
      { kind: "param", key: "latentHeat" },
    ],
    compute: {
      kind: "direct",
      run: () => {
        const zone = (x: number) => zoneAt(VS.defaultValue, P, x);
        const rise = (steamEnthalpy(QUALITY.max) / steamEnthalpy(QUALITY.min) - 1) * 100;
        const field = QUALITY.fieldRange;
        return {
          graph: {
            title: "Drier steam heats more rock",
            subtitle: `At ${f(VS.defaultValue)} m³ of steam.`,
            x: { label: "Steam quality (fraction)", format: (v) => f(v, 2) },
            y: { label: "Heated zone volume (m³)" },
            series: [
              {
                id: "vh",
                label: "Heated volume",
                role: "main",
                unit: "m³",
                digits: 0,
                points: steps(QUALITY.min, QUALITY.max, QUALITY.step).map((x) => ({ x, y: zone(x).volumeM3 })),
              },
            ],
            bands: field ? [{ from: field[0], to: field[1], tone: "green", label: "Field practice" }] : [],
            marker: { x: QUALITY.defaultValue, label: "Default" },
            formatX: (x) => `x = ${f(x, 2)}`,
          },
          facts: [
            `From x = ${f(QUALITY.min, 2)} to ${f(QUALITY.max, 2)}, the heat per kilogram of steam rises from ${f(steamEnthalpy(QUALITY.min))} to ${f(steamEnthalpy(QUALITY.max))} kJ/kg, ${f(rise, 0)}% more.`,
            `The heated volume goes from ${f(zone(QUALITY.min).volumeM3)} to ${f(zone(QUALITY.max).volumeM3)} m³, and τ from ${f(coolingTimeConstant(zone(QUALITY.min).radiusM), 1)} to ${f(coolingTimeConstant(zone(QUALITY.max).radiusM), 1)} days.`,
          ],
        };
      },
    },
  },
  {
    id: "steam-temperature-start",
    group: "steam",
    from: "Steam temperature T_s",
    to: "Day-zero rock temperature",
    shape: "Linear",
    summary:
      "Production starts with the zone at steam temperature, so the day-zero temperature moves one for one with it. This sets the headroom before the oil thickens.",
    equations: [2, 7],
    terms: [
      { kind: "param", key: "steamTempC" },
      { kind: "param", key: "reservoirTempC" },
      { kind: "variable", key: "reservoirTempC" },
    ],
    compute: {
      kind: "direct",
      run: () => {
        const [lo, hi] = STUDY_RANGES.steamTempC;
        return {
          graph: {
            title: "The cycle starts at steam temperature",
            subtitle: "The model fixes T_s at an effective downhole value; this graph varies it.",
            x: { label: "Steam temperature (°C)" },
            y: { label: "Temperature on production day 0 (°C)" },
            series: [
              {
                id: "t0",
                label: "Day-zero temperature",
                role: "main",
                unit: "°C",
                digits: 0,
                points: steps(lo, hi, 5).map((x) => ({ x, y: productionTemperature(0, WORKED_TAU, withParams({ steamTempC: x })) })),
              },
            ],
            marker: { x: P.steamTempC, label: "Model value" },
            formatX: (x) => `T_s = ${f(x, 0)} °C`.replace("_", ""),
          },
          facts: [
            `At the model's ${f(P.steamTempC)} °C, the cycle starts ${f(P.steamTempC - P.reservoirTempC)} °C above the native ${f(P.reservoirTempC)} °C.`,
            `Across ${f(lo)}–${f(hi)} °C the headroom runs from ${f(lo - P.reservoirTempC)} to ${f(hi - P.reservoirTempC)} °C.`,
          ],
        };
      },
    },
  },
  {
    id: "steam-temperature-heated-zone",
    group: "steam",
    from: "Steam temperature T_s",
    to: "Heated zone V_h and τ",
    shape: "Mild inverse",
    summary:
      "Hotter steam spreads the same heat across a larger temperature gap, so the heated zone is a little smaller and cools a little sooner. This pulls against the higher start temperature.",
    equations: [1, 2],
    terms: [
      { kind: "param", key: "steamTempC" },
      { kind: "variable", key: "heatedVolumeM3" },
      { kind: "variable", key: "tauDays" },
    ],
    compute: {
      kind: "direct",
      run: () => {
        const [lo, hi] = STUDY_RANGES.steamTempC;
        const zone = (ts: number) => zoneAt(VS.defaultValue, withParams({ steamTempC: ts }));
        const tau = (ts: number) => coolingTimeConstant(zone(ts).radiusM, withParams({ steamTempC: ts }));
        const smaller = (1 - zone(hi).volumeM3 / zone(lo).volumeM3) * 100;
        return {
          graph: {
            title: "Hotter steam, slightly smaller zone",
            subtitle: `At ${f(VS.defaultValue)} m³ of steam.`,
            x: { label: "Steam temperature (°C)" },
            y: { label: "Heated zone volume (m³)" },
            series: [
              {
                id: "vh",
                label: "Heated volume",
                role: "main",
                unit: "m³",
                digits: 0,
                points: steps(lo, hi, 5).map((x) => ({ x, y: zone(x).volumeM3 })),
              },
            ],
            marker: { x: P.steamTempC, label: "Model value" },
            formatX: (x) => `${f(x, 0)} °C`,
          },
          facts: [
            `From ${f(lo)} to ${f(hi)} °C the heated volume falls from ${f(zone(lo).volumeM3)} to ${f(zone(hi).volumeM3)} m³, ${f(smaller, 0)}% smaller.`,
            `τ falls from ${f(tau(lo), 1)} to ${f(tau(hi), 1)} days.`,
          ],
        };
      },
    },
  },
  {
    id: "efficiency-heated-zone",
    group: "steam",
    from: "Thermal efficiency η",
    to: "Heated zone V_h",
    shape: "Linear",
    summary:
      "A straight scaling on the heat that stays in the rock. It is a calibration factor, not an operating choice, so the model holds it fixed.",
    equations: [1],
    terms: [
      { kind: "param", key: "thermalEfficiency" },
      { kind: "variable", key: "heatedVolumeM3" },
    ],
    compute: {
      kind: "direct",
      run: () => {
        const [lo, hi] = STUDY_RANGES.thermalEfficiency;
        const vh = (eta: number) => zoneAt(VS.defaultValue, withParams({ thermalEfficiency: eta })).volumeM3;
        return {
          graph: {
            title: "Efficiency scales the heated zone",
            subtitle: `At ${f(VS.defaultValue)} m³ of steam. The marker is the model value.`,
            x: { label: "Thermal efficiency η (fraction)", format: (v) => f(v, 2) },
            y: { label: "Heated zone volume (m³)", min: 0 },
            series: [
              {
                id: "vh",
                label: "Heated volume",
                role: "main",
                unit: "m³",
                digits: 0,
                points: steps(lo, hi, 0.01).map((x) => ({ x, y: vh(x) })),
              },
            ],
            marker: { x: P.thermalEfficiency, label: "Model value" },
            formatX: (x) => `η = ${f(x, 2)}`,
          },
          facts: [
            `The heated volume is ${f(vh(lo))} m³ at η = ${f(lo, 1)}, ${f(vh(P.thermalEfficiency))} m³ at the model's ${f(P.thermalEfficiency, 1)}, and ${f(vh(hi))} m³ at ${f(hi, 1)}.`,
            "Field data must fix η. Until then the model holds it constant.",
          ],
        };
      },
    },
  },
  {
    id: "day-temperature",
    group: "time",
    from: "Day in the cycle t",
    to: "Rock temperature T",
    shape: "Exponential decay",
    summary: "The temperature falls fast in the first weeks, then more slowly, towards the native temperature.",
    equations: [2],
    terms: [
      { kind: "time" },
      { kind: "variable", key: "tauDays" },
      { kind: "variable", key: "reservoirTempC" },
      { kind: "param", key: "reservoirTempC" },
      { kind: "param", key: "steamTempC" },
    ],
    compute: {
      kind: "direct",
      run: () => {
        const cases = [VS.defaultValue, VS.max, VS.min];
        const span = CYCLE.defaultValue * 2;
        return {
          graph: {
            title: "The zone cools towards 50 °C".replace("50", f(P.reservoirTempC)),
            subtitle: "Three steam volumes, so three cooling constants.",
            x: { label: "Production day" },
            y: { label: "Rock temperature (°C)", min: 0 },
            series: cases.map((vs, i) => ({
              id: `t-${vs}`,
              label: `${f(vs)} m³, τ ${f(tauAt(vs), 1)} d`,
              role: "main" as const,
              unit: "°C",
              digits: 1,
              opacity: TINTS[i],
              points: steps(0, span, 1).map((d) => ({ x: d, y: productionTemperature(d, tauAt(vs)) })),
            })),
            marker: { x: CYCLE.defaultValue, label: "Default" },
            formatX: dayLabel,
          },
          facts: [
            `The excess over ${f(P.reservoirTempC)} °C halves every ${f(Math.LN2 * WORKED_TAU, 1)} days when τ = ${f(WORKED_TAU, 0)} days.`,
            `In the worked case the zone is at ${f(productionTemperature(30, WORKED_TAU), 1)} °C on day 30, ${f(productionTemperature(60, WORKED_TAU), 1)} °C on day 60 and ${f(productionTemperature(90, WORKED_TAU), 1)} °C on day 90.`,
          ],
        };
      },
    },
  },
  {
    id: "tau-temperature",
    group: "time",
    from: "Cooling constant τ",
    to: "Temperature on a given day",
    shape: "Saturating rise",
    summary:
      "A larger τ stretches the cooling curve, so on any given day the well is warmer. Each extra day of τ adds less than the one before.",
    equations: [2],
    terms: [
      { kind: "variable", key: "tauDays" },
      { kind: "variable", key: "reservoirTempC" },
      { kind: "time" },
    ],
    compute: {
      kind: "direct",
      run: () => {
        const day = CYCLE.defaultValue / 2;
        const tauInf = tauInfinity();
        return {
          graph: {
            title: `Temperature on production day ${f(day)}`,
            subtitle: "The marker is the worked case.",
            x: { label: "Cooling constant τ (days)" },
            y: { label: "Rock temperature (°C)" },
            series: [
              {
                id: "t",
                label: `Day ${f(day)}`,
                role: "main",
                unit: "°C",
                digits: 1,
                points: steps(5, Math.floor(tauInf), 0.5).map((tau) => ({ x: tau, y: productionTemperature(day, tau) })),
              },
            ],
            marker: { x: WORKED_TAU, label: "Worked case" },
            formatX: (x) => `τ = ${f(x, 1)} days`,
          },
          facts: [
            `On day ${f(day)} the zone is at ${f(productionTemperature(day, tauAt(VS.min)), 1)} °C with ${f(VS.min)} m³ of steam (τ ${f(tauAt(VS.min), 1)} d), ${f(productionTemperature(day, WORKED_TAU), 1)} °C with ${f(VS.defaultValue)} m³ and ${f(productionTemperature(day, tauAt(VS.max)), 1)} °C with ${f(VS.max)} m³.`,
          ],
        };
      },
    },
  },
  {
    id: "temperature-viscosity",
    group: "viscosity",
    from: "Rock temperature T",
    to: "Oil viscosity μ",
    shape: "Double-logarithmic",
    summary:
      "The steepest link in the model. As the oil cools, viscosity rises faster than any exponential. A small temperature drop late in the cycle is a large thickening.",
    equations: [3],
    terms: [
      { kind: "variable", key: "reservoirTempC" },
      { kind: "variable", key: "viscosityCp" },
      { kind: "param", key: "anchorViscosityCp" },
      { kind: "param", key: "waltherB" },
      { kind: "param", key: "oilDensity" },
    ],
    compute: {
      kind: "direct",
      run: () => {
        const t30 = productionTemperature(30, WORKED_TAU);
        const t60 = productionTemperature(60, WORKED_TAU);
        const t90 = productionTemperature(90, WORKED_TAU);
        return {
          graph: {
            title: "Viscosity climbs steeply as the oil cools",
            x: { label: "Temperature (°C)" },
            y: { label: "Viscosity (cP, log scale)", scale: "log" },
            series: [
              {
                id: "mu",
                label: "Viscosity",
                role: "main",
                unit: "cP",
                digits: 1,
                points: steps(P.reservoirTempC, P.steamTempC, 1).map((x) => ({ x, y: viscosityCp(x) })),
              },
            ],
            formatX: (x) => `${f(x, 0)} °C`,
          },
          facts: [
            `${f(viscosityCp(P.steamTempC), 1)} cP at ${f(P.steamTempC)} °C, ${f(viscosityCp(t30), 1)} cP at ${f(t30, 1)} °C (day 30), ${f(viscosityCp(t60))} cP at ${f(t60, 1)} °C (day 60) and ${f(viscosityCp(t90))} cP at ${f(t90, 1)} °C (day 90).`,
            `The last ${f(t90 - P.reservoirTempC, 0)} °C down to ${f(P.reservoirTempC)} °C multiplies the viscosity by ${f(viscosityCp(P.reservoirTempC) / viscosityCp(t90), 1)}, to ${f(viscosityCp(P.reservoirTempC))} cP.`,
          ],
        };
      },
    },
  },
  {
    id: "walther-b-viscosity",
    group: "viscosity",
    from: "Walther slope B",
    to: "Oil viscosity μ",
    shape: "Pivot at the anchor",
    summary:
      "B sets how strongly viscosity responds to temperature. The curve is fixed at the anchor temperature, so every B agrees there, and the curves spread apart away from it.",
    equations: [3, 5],
    terms: [
      { kind: "param", key: "waltherB" },
      { kind: "param", key: "anchorTempC" },
      { kind: "variable", key: "viscosityCp" },
    ],
    compute: {
      kind: "direct",
      run: () => {
        const [bLo, bHi] = STUDY_RANGES.waltherB;
        const pLo = withParams({ waltherB: bLo });
        const pHi = withParams({ waltherB: bHi });
        const temps = steps(30, P.steamTempC, 2);
        const spread = (t: number) => {
          const a = viscosityCp(t, pLo);
          const b = viscosityCp(t, pHi);
          return (Math.max(a, b) / Math.min(a, b) - 1) * 100;
        };
        // Rounded, so the temperature printed is the one the spread is computed at.
        const t30 = Math.round(productionTemperature(30, WORKED_TAU));
        const t60 = Math.round(productionTemperature(60, WORKED_TAU));
        const bind = (p: ModelParams) => productionDayAtSafeSpeed(p.mechanicalMaxSPM, REFERENCE_CASE.strokeM, WORKED_TAU, p) ?? NaN;
        const curve = (p: ModelParams) => temps.map((x) => ({ x, y: viscosityCp(x, p) }));
        return {
          graph: {
            title: "Every B agrees at the anchor",
            subtitle: `B = ${f(bLo, 1)} to ${f(bHi, 1)}; the shaded band is the spread.`,
            x: { label: "Temperature (°C)" },
            y: { label: "Viscosity (cP, log scale)", scale: "log" },
            series: [
              { id: "b-mid", label: `B = ${f(P.waltherB, 1)} (model)`, role: "main", unit: "cP", digits: 1, opacity: TINTS[0], points: curve(P) },
              { id: "b-hi", label: `B = ${f(bHi, 1)}`, role: "main", unit: "cP", digits: 1, opacity: TINTS[1], points: curve(pHi) },
              { id: "b-lo", label: `B = ${f(bLo, 1)}`, role: "main", unit: "cP", digits: 1, opacity: TINTS[2], points: curve(pLo) },
            ],
            areas: [
              {
                id: "spread",
                label: "Spread",
                lower: temps.map((x) => ({ x, y: Math.min(viscosityCp(x, pLo), viscosityCp(x, pHi)) })),
                upper: temps.map((x) => ({ x, y: Math.max(viscosityCp(x, pLo), viscosityCp(x, pHi)) })),
              },
            ],
            formatX: (x) => `${f(x, 0)} °C`,
          },
          facts: [
            `Spread here means the higher of the two viscosities divided by the lower, minus one, for B = ${f(bLo, 1)} and B = ${f(bHi, 1)}.`,
            `The spread is ${f(spread(P.anchorTempC), 0)}% at ${f(P.anchorTempC)} °C, ${f(spread(t60), 0)}% at ${f(t60, 0)} °C (day 60), ${f(spread(t30), 0)}% at ${f(t30, 0)} °C (day 30) and ${f(spread(P.steamTempC), 0)}% at ${f(P.steamTempC)} °C. Below the anchor it is ${f(spread(30), 0)}% at 30 °C.`,
            `Above ${f(P.anchorTempC)} °C the higher B gives the thinner oil; below it, the thicker oil. The day the float limit binds moves only from day ${f(bind(pLo), 1)} (B = ${f(bLo, 1)}) to day ${f(bind(pHi), 1)} (B = ${f(bHi, 1)}).`,
          ],
        };
      },
    },
  },
  {
    id: "viscosity-safe-speed",
    group: "consequences",
    from: "Oil viscosity μ",
    to: "Maximum safe pump speed N_max",
    shape: "Inverse, then capped",
    summary:
      "The safe speed is inversely proportional to viscosity: double the viscosity, halve the safe speed. While the oil is thin, the mechanical ceiling is the real limit. Then the safe speed falls within weeks.",
    equations: [3, 5],
    terms: [
      { kind: "variable", key: "viscosityCp" },
      { kind: "variable", key: "safePumpSpeedSPM" },
      { kind: "param", key: "mechanicalMaxSPM" },
      { kind: "input", key: "strokeM" },
    ],
    compute: {
      kind: "direct",
      run: () => {
        const S = REFERENCE_CASE.strokeM;
        const bindDay = productionDayAtSafeSpeed(P.mechanicalMaxSPM, S, WORKED_TAU) ?? NaN;
        const bindViscosity = floatConstant() / (P.mechanicalMaxSPM * S);
        const end = CYCLE.defaultValue;
        return {
          graph: {
            title: "Flat at the ceiling, then a fast fall",
            subtitle: `Worked case: ${f(S, 1)} m stroke, τ = ${f(WORKED_TAU, 0)} days.`,
            x: { label: "Production day" },
            y: { label: "Safe pump speed (SPM)", min: 0 },
            series: [
              {
                id: "nmax",
                label: "Safe speed",
                role: "main",
                unit: "SPM",
                digits: 2,
                points: steps(0, 150, 1).map((d) => ({ x: d, y: safeSpeedOnDay(d, S) })),
              },
            ],
            rules: [{ y: P.mechanicalMaxSPM, label: `Mechanical ceiling ${f(P.mechanicalMaxSPM)} SPM` }],
            marker: { x: bindDay, label: "Limit binds" },
            formatX: dayLabel,
          },
          facts: [
            `The limit first falls below ${f(P.mechanicalMaxSPM)} SPM on day ${f(bindDay, 1)}, when the zone is at ${f(temperatureAtViscosity(bindViscosity), 1)} °C and the oil at ${f(bindViscosity)} cP.`,
            `By day ${f(end)} the safe speed is ${f(safeSpeedOnDay(end, S), 2)} SPM. Fully cold, at ${f(P.reservoirTempC)} °C, it is ${f(safePumpSpeed(viscosityCp(P.reservoirTempC), S), 1)} SPM.`,
          ],
        };
      },
    },
  },
  {
    id: "stroke-binding-day",
    group: "consequences",
    from: "Stroke length S",
    to: "Day the speed limit binds",
    shape: "Inverse",
    summary:
      "A longer stroke means the rods must fall farther in the same half-stroke time. The safe speed is lower, so the limit binds earlier in the cycle.",
    equations: [5],
    terms: [
      { kind: "input", key: "strokeM" },
      { kind: "variable", key: "safePumpSpeedSPM" },
      { kind: "param", key: "mechanicalMaxSPM" },
    ],
    compute: {
      kind: "sweep",
      jobs: [{ base: BASE, target: { kind: "input", key: "strokeM" }, values: steps(STROKE.min, STROKE.max, STROKE.step) }],
      build: ([points]) => {
        const day = (s: number) => resultAt(points, s).summary.limitBindsDay ?? NaN;
        return {
          graph: {
            title: "A longer stroke brings the limit forward",
            x: { label: "Stroke length (m)", format: (v) => f(v, 1) },
            y: { label: "Production day the limit binds", min: 0 },
            series: [
              {
                id: "bind",
                label: "Binding day",
                role: "main",
                unit: "day",
                digits: 1,
                points: points.map((p) => ({ x: p.value, y: p.result.summary.limitBindsDay })),
              },
            ],
            marker: { x: REFERENCE_CASE.strokeM, label: "Worked case" },
            formatX: (x) => `S = ${f(x, 1)} m`,
          },
          facts: [
            `The limit binds on day ${f(day(STROKE.min), 1)} with a ${f(STROKE.min, 1)} m stroke, day ${f(day(REFERENCE_CASE.strokeM), 1)} with ${f(REFERENCE_CASE.strokeM, 1)} m and day ${f(day(STROKE.max), 1)} with ${f(STROKE.max, 1)} m.`,
            `Going from ${f(STROKE.min, 0)} m to ${f(STROKE.max, 0)} m cuts the viscosity-limited safe speed to 1/${f(STROKE.max / STROKE.min, 0)}.`,
          ],
        };
      },
    },
  },
  {
    id: "viscosity-inflow",
    group: "consequences",
    from: "Oil viscosity μ",
    to: "Reservoir inflow q_in",
    shape: "Inverse, naturally capped",
    summary:
      "Thin oil flows more easily, so inflow rises as viscosity falls. The cold rock beyond the heated zone still resists flow, so the rate has a ceiling. As the zone cools, the rate falls back to the cold rate, not to zero.",
    equations: [4],
    terms: [
      { kind: "variable", key: "viscosityCp" },
      { kind: "variable", key: "heatedRadiusM" },
      { kind: "variable", key: "inflowRateBblD" },
      { kind: "param", key: "coldRateBblD" },
      { kind: "param", key: "drainageRadiusM" },
    ],
    compute: {
      kind: "direct",
      run: () => {
        const ceiling = inflowCeilingRatio(WORKED_RADIUS) * P.coldRateBblD;
        const viscosities = steps(P.reservoirTempC, P.steamTempC, 1)
          .map((t) => viscosityCp(t))
          .sort((a, b) => a - b);
        const mu60 = viscosityCp(productionTemperature(60, WORKED_TAU));
        const mu90 = viscosityCp(productionTemperature(90, WORKED_TAU));
        return {
          graph: {
            title: "Inflow falls towards the cold rate",
            subtitle: `Heated radius ${f(WORKED_RADIUS, 1)} m (worked case).`,
            x: { label: "Viscosity in the heated zone (cP, log scale)", scale: "log" },
            y: { label: "Reservoir inflow (bbl/d)", min: 0 },
            series: [
              {
                id: "qin",
                label: "Inflow",
                role: "main",
                unit: "bbl/d",
                digits: 1,
                points: viscosities.map((mu) => ({ x: mu, y: inflowRate(mu, WORKED_RADIUS) })),
              },
            ],
            rules: [
              { y: ceiling, label: `Ceiling ${f(ceiling, 1)} bbl/d` },
              { y: P.coldRateBblD, label: `Cold rate ${f(P.coldRateBblD)} bbl/d` },
            ],
            formatX: (x) => `${f(x, 0)} cP`,
          },
          facts: [
            `With very thin oil only the cold zone resists flow, so inflow tops out at ${f(ceiling, 1)} bbl/d, ${f(inflowCeilingRatio(WORKED_RADIUS), 2)} times the cold rate of ${f(P.coldRateBblD)} bbl/d.`,
            `At ${f(mu60)} cP (day 60) inflow is ${f(inflowRate(mu60, WORKED_RADIUS), 1)} bbl/d; at ${f(mu90)} cP (day 90) it is ${f(inflowRate(mu90, WORKED_RADIUS), 1)} bbl/d.`,
          ],
        };
      },
    },
  },
  {
    id: "radius-peak-rate",
    group: "consequences",
    from: "Heated zone radius r_h",
    to: "Peak oil rate",
    shape: "Rises, diminishing",
    summary:
      "A bigger heated zone moves more of the flow path into thin oil, so it raises the ceiling on the rate. Each extra metre adds less.",
    equations: [4],
    terms: [
      { kind: "variable", key: "heatedRadiusM" },
      { kind: "variable", key: "inflowRateBblD" },
      { kind: "param", key: "wellRadiusM" },
      { kind: "param", key: "drainageRadiusM" },
    ],
    compute: {
      kind: "direct",
      run: () => {
        const r = (vs: number) => zoneAt(vs).radiusM;
        return {
          graph: {
            title: "A bigger zone lifts the ceiling",
            subtitle: "The ceiling is the peak inflow as a multiple of the cold rate.",
            x: { label: "Heated zone radius (m)" },
            y: { label: "Peak inflow ÷ cold rate", min: 0 },
            series: [
              {
                id: "ceiling",
                label: "Ceiling ratio",
                role: "main",
                digits: 2,
                points: steps(1, 30, 0.25).map((x) => ({ x, y: inflowCeilingRatio(x) })),
              },
            ],
            marker: { x: WORKED_RADIUS, label: "Worked case" },
            formatX: (x) => `r_h = ${f(x, 1)} m`.replace("_", ""),
          },
          facts: [
            `${f(inflowCeilingRatio(r(VS.min)), 1)} times the cold rate at ${f(r(VS.min), 1)} m (${f(VS.min)} m³), ${f(inflowCeilingRatio(r(VS.defaultValue)), 1)} times at ${f(r(VS.defaultValue), 1)} m (${f(VS.defaultValue)} m³) and ${f(inflowCeilingRatio(r(VS.max)), 1)} times at ${f(r(VS.max), 1)} m (${f(VS.max)} m³).`,
          ],
        };
      },
    },
  },
  {
    id: "pump-capacity-rate",
    group: "consequences",
    from: "Pump capacity Q_pump",
    to: "Oil rate q",
    shape: "Minimum (bottleneck)",
    summary:
      "The surface rate is the smaller of inflow and pump capacity at the set speed. Slowing the pump costs oil only when its capacity falls below inflow.",
    equations: [4],
    terms: [
      { kind: "input", key: "strokeM" },
      { kind: "input", key: "pumpSpeedSPM" },
      { kind: "variable", key: "pumpCapacityBblD" },
      { kind: "variable", key: "inflowRateBblD" },
      { kind: "variable", key: "flowRateBblD" },
    ],
    compute: {
      kind: "sweep",
      jobs: [single(BASE), single({ ...BASE, strokeM: STROKE.min, pumpSpeedSPM: SPEED.min })],
      build: ([[worked], [limited]]) => {
        const small = pumpCapacity(STROKE.min, SPEED.min);
        const full = pumpCapacity(REFERENCE_CASE.strokeM, WORKED_SPEED);
        const end = CYCLE.defaultValue;
        const nEnd = safeSpeedOnDay(end);
        const qEnd = productionDays(worked.result).at(-1)?.inferred.inflowRateBblD ?? NaN;
        const line = (r: CycleResult) => productionDays(r).map((d) => ({ x: d.phaseDay, y: d.measured.flowRateBblD }));
        return {
          graph: {
            title: "The pump caps the rate only when it is small",
            x: { label: "Production day" },
            y: { label: "Oil rate at the surface (bbl/d)", min: 0 },
            series: [
              { id: "worked", label: `${f(REFERENCE_CASE.strokeM, 1)} m, ${f(WORKED_SPEED)} SPM`, role: "main", unit: "bbl/d", digits: 1, points: line(worked.result) },
              { id: "limited", label: `${f(STROKE.min, 0)} m, ${f(SPEED.min)} SPM`, role: "limit", unit: "bbl/d", digits: 1, points: line(limited.result) },
            ],
            rules: [{ y: small, label: `Capacity at ${f(STROKE.min, 0)} m, ${f(SPEED.min)} SPM` }],
            formatX: dayLabel,
          },
          facts: [
            `At ${f(REFERENCE_CASE.strokeM, 1)} m and ${f(WORKED_SPEED)} SPM the pump can lift ${f(full, 1)} bbl/d, far above inflow, so the reservoir sets the rate all cycle. SOR is ${f(worked.result.summary.steamOilRatio, 2)}.`,
            `At ${f(STROKE.min, 0)} m and ${f(SPEED.min)} SPM it lifts only ${f(small, 1)} bbl/d, below the early inflow, so the pump caps the rate and SOR rises to ${f(limited.result.summary.steamOilRatio, 2)}.`,
            `On day ${f(end)} the safe speed is ${f(nEnd, 1)} SPM, which still lifts ${f(pumpCapacity(REFERENCE_CASE.strokeM, nEnd), 0)} bbl/d against ${f(qEnd, 1)} bbl/d of inflow. Slowing to the safe speed costs almost nothing.`,
          ],
        };
      },
    },
  },
  {
    id: "rate-cumulative-oil",
    group: "totals",
    from: "Oil rate q over time",
    to: "Cumulative oil N_p",
    shape: "Integral",
    summary:
      "Cumulative oil is the running total of the daily rate. It climbs fastest early, when the rate is highest, and keeps rising at about the cold rate.",
    equations: [4],
    terms: [
      { kind: "variable", key: "flowRateBblD" },
      { kind: "variable", key: "cumulativeOilBbl" },
      { kind: "time" },
    ],
    compute: {
      kind: "sweep",
      jobs: [single(BASE)],
      build: ([[worked]]) => {
        const days = productionDays(worked.result);
        let total = 0;
        const points = days.map((d, i) => {
          if (i > 0) total += (days[i - 1].measured.flowRateBblD + d.measured.flowRateBblD) / 2; // trapezoid, as in cycle.ts
          return { x: d.phaseDay, y: total };
        });
        const at = (day: number) => points.find((p) => p.x === day)?.y ?? NaN;
        const end = CYCLE.defaultValue;
        return {
          graph: {
            title: "Cumulative oil climbs fast, then steadily",
            subtitle: "Worked case.",
            x: { label: "Production day" },
            y: { label: "Cumulative oil (bbl)", min: 0 },
            series: [{ id: "np", label: "Cumulative oil", role: "main", unit: "bbl", digits: 0, points }],
            formatX: dayLabel,
          },
          facts: [
            `${f(at(30))} bbl by day 30, ${f(at(60))} bbl by day 60 and ${f(at(end))} bbl by day ${f(end)}.`,
            `The first half of the cycle gives ${f((at(end / 2) / at(end)) * 100, 0)}% of the oil.`,
          ],
        };
      },
    },
  },
  {
    id: "steam-volume-cumulative-oil",
    group: "totals",
    from: "Steam volume V_s",
    to: "Cumulative oil N_p",
    shape: "Concave",
    summary:
      "More steam keeps the well hot longer and raises the peak rate, so the cycle gives more oil. But each extra cubic metre adds less than the one before.",
    equations: [1, 2, 3, 4],
    terms: [
      { kind: "input", key: "steamVolumeM3" },
      { kind: "variable", key: "cumulativeOilBbl" },
    ],
    compute: {
      kind: "sweep",
      jobs: [VOLUME_SWEEP],
      build: ([points]) => {
        const np = (v: number) => resultAt(points, v).summary.cumulativeOilBbl;
        const step = 1000;
        return {
          graph: {
            title: "More steam, more oil, with diminishing gains",
            subtitle: `${f(CYCLE.defaultValue)} production days.`,
            x: { label: "Steam volume (m³)" },
            y: { label: "Cumulative oil (bbl)", min: 0 },
            series: [
              {
                id: "np",
                label: "Cumulative oil",
                role: "main",
                unit: "bbl",
                digits: 0,
                points: points.map((p) => ({ x: p.value, y: p.result.summary.cumulativeOilBbl })),
              },
            ],
            marker: { x: VS.defaultValue, label: "Default" },
            formatX: volumeLabel,
          },
          facts: [
            `${f(np(VS.min))} bbl at ${f(VS.min)} m³, ${f(np(VS.defaultValue))} bbl at ${f(VS.defaultValue)} m³ and ${f(np(VS.max))} bbl at ${f(VS.max)} m³.`,
            `Going from ${f(1000)} to ${f(2000)} m³ adds ${f(np(2000) - np(1000))} bbl; going from ${f(VS.max - step)} to ${f(VS.max)} m³ adds only ${f(np(VS.max) - np(VS.max - step))} bbl.`,
          ],
        };
      },
    },
  },
  {
    id: "steam-volume-sor",
    group: "totals",
    from: "Steam volume V_s",
    to: "Steam–oil ratio SOR",
    shape: "Rises",
    summary:
      "SOR is steam divided by oil. Steam rises in step with steam volume; oil rises more slowly. So SOR rises with steam volume. Small volumes look efficient partly because SOR counts the cold oil the well gives anyway.",
    equations: [4],
    terms: [
      { kind: "input", key: "steamVolumeM3" },
      { kind: "variable", key: "cumulativeOilBbl" },
      { kind: "variable", key: "steamOilRatio" },
    ],
    compute: {
      kind: "sweep",
      jobs: [VOLUME_SWEEP],
      build: ([points]) => {
        const sor = (v: number) => resultAt(points, v).summary.steamOilRatio;
        return {
          graph: {
            title: "SOR rises with steam volume",
            subtitle: `${f(CYCLE.defaultValue)} production days.`,
            x: { label: "Steam volume (m³)" },
            y: { label: "Steam–oil ratio", min: 0 },
            series: [
              {
                id: "sor",
                label: "SOR",
                role: "main",
                digits: 2,
                points: points.map((p) => ({ x: p.value, y: p.result.summary.steamOilRatio })),
              },
            ],
            marker: { x: VS.defaultValue, label: "Default" },
            formatX: volumeLabel,
          },
          facts: [
            `SOR is ${f(sor(VS.min), 2)} at ${f(VS.min)} m³, ${f(sor(VS.defaultValue), 2)} at ${f(VS.defaultValue)} m³ and ${f(sor(VS.max), 2)} at ${f(VS.max)} m³.`,
            "The lowest SOR is not the most oil: the smallest volume also gives the least oil (see the previous relationship).",
          ],
        };
      },
    },
  },
  {
    id: "cycle-length-sor",
    group: "totals",
    from: "Cycle length t_cut",
    to: "Steam–oil ratio SOR",
    shape: "Keeps falling, more slowly",
    summary:
      "A longer cycle spreads the same steam over more oil, so SOR falls. It keeps falling after the heat is gone, because the well still gives the cold rate. The model covers one cycle, so it does not count the oil lost by re-steaming late.",
    equations: [4],
    terms: [
      { kind: "input", key: "productionDays" },
      { kind: "variable", key: "steamOilRatio" },
    ],
    compute: {
      kind: "sweep",
      jobs: [
        {
          base: BASE,
          target: { kind: "input", key: "productionDays" },
          values: [...steps(CYCLE.min, CYCLE.max - 5, 15), CYCLE.max],
        },
      ],
      build: ([points]) => {
        const sor = (d: number) => resultAt(points, d).summary.steamOilRatio;
        return {
          graph: {
            title: "Longer cycles lower SOR",
            x: { label: "Production days before re-steaming" },
            y: { label: "Steam–oil ratio", min: 0 },
            series: [
              {
                id: "sor",
                label: "SOR",
                role: "main",
                digits: 2,
                points: points.map((p) => ({ x: p.value, y: p.result.summary.steamOilRatio })),
              },
            ],
            marker: { x: CYCLE.defaultValue, label: "Default" },
            formatX: (x) => `${f(x, 0)} production days`,
          },
          facts: [
            `SOR is ${f(sor(CYCLE.min), 2)} at ${f(CYCLE.min)} days, ${f(sor(CYCLE.defaultValue), 2)} at ${f(CYCLE.defaultValue)}, ${f(sor(240), 2)} at 240 and ${f(sor(CYCLE.max), 2)} at ${f(CYCLE.max)}.`,
          ],
        };
      },
    },
  },
  {
    id: "stroke-sor",
    group: "totals",
    from: "Stroke length S",
    to: "Steam–oil ratio SOR",
    shape: "None unless the pump limits",
    summary:
      "Stroke sets pump capacity. At the default speed the pump lifts far more than the reservoir gives, so stroke does not change SOR. It matters only at low speed and short stroke, where the pump becomes the bottleneck.",
    equations: [4],
    terms: [
      { kind: "input", key: "strokeM" },
      { kind: "input", key: "pumpSpeedSPM" },
      { kind: "variable", key: "pumpCapacityBblD" },
      { kind: "variable", key: "steamOilRatio" },
    ],
    compute: {
      kind: "sweep",
      jobs: [
        { base: BASE, target: { kind: "input", key: "strokeM" }, values: steps(STROKE.min, STROKE.max, STROKE.step) },
        { base: { ...BASE, pumpSpeedSPM: SPEED.min }, target: { kind: "input", key: "strokeM" }, values: steps(STROKE.min, STROKE.max, STROKE.step) },
      ],
      build: ([normal, slow]) => {
        const line = (points: SweepPoint[]) => points.map((p) => ({ x: p.value, y: p.result.summary.steamOilRatio }));
        return {
          graph: {
            title: "Stroke matters only when the pump is small",
            x: { label: "Stroke length (m)", format: (v) => f(v, 1) },
            y: { label: "Steam–oil ratio", min: 0 },
            series: [
              { id: "normal", label: `${f(WORKED_SPEED)} SPM`, role: "main", digits: 2, points: line(normal) },
              { id: "slow", label: `${f(SPEED.min)} SPM`, role: "limit", digits: 2, points: line(slow) },
            ],
            formatX: (x) => `S = ${f(x, 1)} m`,
          },
          facts: [
            `At ${f(WORKED_SPEED)} SPM, SOR stays at ${f(resultAt(normal, STROKE.min).summary.steamOilRatio, 2)} from ${f(STROKE.min, 0)} m to ${f(STROKE.max, 0)} m.`,
            `At ${f(SPEED.min)} SPM and ${f(STROKE.min, 0)} m the pump is the bottleneck and SOR rises to ${f(resultAt(slow, STROKE.min).summary.steamOilRatio, 2)}.`,
          ],
        };
      },
    },
  },
  {
    id: "walther-b-sor",
    group: "totals",
    from: "Walther slope B",
    to: "Steam–oil ratio SOR",
    shape: "Mild fall",
    summary:
      "A higher B keeps the oil thinner through the warm part of the cycle, so the rate is a little higher and SOR a little lower.",
    equations: [3, 4],
    terms: [
      { kind: "param", key: "waltherB" },
      { kind: "variable", key: "steamOilRatio" },
    ],
    compute: {
      kind: "sweep",
      jobs: [
        {
          base: BASE,
          target: { kind: "param", key: "waltherB" },
          values: steps(STUDY_RANGES.waltherB[0], STUDY_RANGES.waltherB[1], 0.05),
        },
      ],
      build: ([points]) => {
        const sor = (b: number) => resultAt(points, b).summary.steamOilRatio;
        const [lo, hi] = STUDY_RANGES.waltherB;
        return {
          graph: {
            title: "B moves SOR only a little",
            x: { label: "Walther slope B", format: (v) => f(v, 1) },
            y: { label: "Steam–oil ratio" },
            series: [
              {
                id: "sor",
                label: "SOR",
                role: "main",
                digits: 3,
                points: points.map((p) => ({ x: p.value, y: p.result.summary.steamOilRatio })),
              },
            ],
            marker: { x: P.waltherB, label: "Model value" },
            formatX: (x) => `B = ${f(x, 2)}`,
          },
          facts: [
            `SOR is ${f(sor(lo), 2)} at B = ${f(lo, 1)}, ${f(sor(P.waltherB), 2)} at the model's ${f(P.waltherB, 1)} and ${f(sor(hi), 2)} at ${f(hi, 1)}.`,
          ],
        };
      },
    },
  },
  {
    id: "schedule-floating-risk",
    group: "schedule",
    from: "Pump schedule",
    to: "Floating risk N/N_max",
    shape: "Held speed crosses the falling limit",
    summary:
      "A schedule that follows the safe speed keeps the risk below 1. If the operator stops following it and holds the speed, the safe speed keeps falling, the risk passes 1 and the rods float.",
    equations: [5],
    terms: [
      { kind: "input", key: "pumpSpeedSPM" },
      { kind: "variable", key: "safePumpSpeedSPM" },
      { kind: "variable", key: "floatingRisk" },
    ],
    compute: {
      kind: "sweep",
      // 150 days, so the constant-speed case reaches its floating day.
      jobs: [
        single({ ...BASE, productionDays: 150 }),
        single({ ...BASE, productionDays: 150, pumpSpeedSPM: { kind: "follow-limit", fraction: PRESET_RANGES.fraction.defaultValue } }),
        single({
          ...BASE,
          productionDays: 150,
          pumpSpeedSPM: {
            kind: "follow-then-hold",
            fraction: PRESET_RANGES.fraction.defaultValue,
            holdFromDay: PRESET_RANGES.holdFromDay.defaultValue,
          },
        }),
      ],
      build: ([[constant], [follow], [hold]]) => {
        const risk = (r: CycleResult) => productionDays(r).map((d) => ({ x: d.phaseDay, y: d.inferred.floatingRisk }));
        const fraction = PRESET_RANGES.fraction.defaultValue;
        const holdDay = PRESET_RANGES.holdFromDay.defaultValue;
        const floats = (r: CycleResult) => r.summary.floatingStartsDay;
        const floatText = (r: CycleResult) => (floats(r) === null ? "never float" : `float from day ${f(floats(r) ?? NaN)}`);
        return {
          graph: {
            title: "Holding the speed floats the rods",
            subtitle: `Worked case. Follow the limit at ${f(fraction * 100, 0)}% of the safe speed; hold from day ${f(holdDay)}.`,
            x: { label: "Production day" },
            y: { label: "Floating risk (set speed ÷ safe speed)", min: 0 },
            series: [
              { id: "follow", label: "Follow the limit", role: "main", digits: 2, points: risk(follow.result) },
              { id: "hold", label: `Hold from day ${f(holdDay)}`, role: "limit", digits: 2, points: risk(hold.result) },
              { id: "constant", label: `Constant ${f(WORKED_SPEED)} SPM`, role: "comparison", digits: 2, points: risk(constant.result) },
            ],
            rules: [{ y: 1, label: "Rods float above 1", align: "left" }],
            formatX: dayLabel,
          },
          facts: [
            `Following the limit, the risk never passes ${f(fraction, 2)} and the rods ${floatText(follow.result)}.`,
            `Holding the speed from day ${f(holdDay)}, the rods ${floatText(hold.result)}. At a constant ${f(WORKED_SPEED)} SPM they ${floatText(constant.result)}.`,
            (() => {
              const oil = [follow, hold, constant].map((p) => p.result.summary.cumulativeOilBbl);
              return Math.max(...oil) - Math.min(...oil) < 1
                ? `All three give the same oil, ${f(oil[0])} bbl over 150 days, because the reservoir, not the pump, limits the rate. Holding the speed buys no oil; it only floats the rods.`
                : `Oil over 150 days: ${f(oil[0])} bbl following the limit, ${f(oil[1])} bbl holding, ${f(oil[2])} bbl at a constant speed.`;
            })(),
          ],
        };
      },
    },
  },
];

export const RELATIONSHIP_BY_ID = new Map(RELATIONSHIPS.map((r) => [r.id, r]));
export const GROUP_IDS = Object.keys(GROUPS) as GroupId[];
