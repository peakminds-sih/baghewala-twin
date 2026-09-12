// Many cycles at once: random wells for the CSV export, and parameter sweeps
// for the research graphs. These run in the Web Worker (worker.ts).

import { describeSchedule, simulateCycle } from "./cycle";
import { DEFAULT_PARAMS, INPUT_RANGES, PRESET_RANGES } from "./parameters";
import type {
  CycleResult,
  Inferred,
  InputRange,
  InputKey,
  Measured,
  ModelParams,
  ParamKey,
  SerializablePumpSchedule,
  SerializableWellConfig,
} from "./types";

/** Seeded random numbers in [0, 1) (mulberry32). The same seed gives the same wells. */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function decimalsOf(step: number): number {
  const text = String(step);
  const dot = text.indexOf(".");
  return dot === -1 ? 0 : text.length - dot - 1;
}

/** A uniform random value on the range's step grid. */
function randomOnGrid(range: InputRange, random: () => number): number {
  const steps = Math.round((range.max - range.min) / range.step);
  const k = Math.floor(random() * (steps + 1));
  return Number((range.min + k * range.step).toFixed(decimalsOf(range.step)));
}

const randomInput = (key: InputKey, random: () => number) => randomOnGrid(INPUT_RANGES[key], random);

/**
 * How the batch export picks each well's pump schedule. [Assumption, tier D:
 * synthetic data] A third run at a constant speed, a third follow the safe
 * limit, and a third follow it and then hold (the ignored recommendation,
 * which produces the rod-float failures the ML models most need).
 */
function randomSchedule(random: () => number): SerializablePumpSchedule {
  const pick = random();
  if (pick < 1 / 3) return randomInput("pumpSpeedSPM", random);
  const fraction = randomOnGrid(PRESET_RANGES.fraction, random);
  if (pick < 2 / 3) return { kind: "follow-limit", fraction };
  return { kind: "follow-then-hold", fraction, holdFromDay: randomOnGrid(PRESET_RANGES.holdFromDay, random) };
}

/** Random wells: four operator inputs from the simulator ranges, plus a pump schedule. */
export function randomWells(count: number, seed: number): SerializableWellConfig[] {
  const random = seededRandom(seed);
  return Array.from({ length: count }, () => ({
    steamVolumeM3: randomInput("steamVolumeM3", random),
    steamQuality: randomInput("steamQuality", random),
    soakDays: randomInput("soakDays", random),
    strokeM: randomInput("strokeM", random),
    pumpSpeedSPM: randomSchedule(random),
    productionDays: INPUT_RANGES.productionDays.defaultValue,
  }));
}

// CSV columns. measured_* are the ML features and inferred_* are the targets.
// The Record types make the compiler check that every field is exported under
// its own prefix and nowhere else.
const MEASURED_COLUMNS: Record<keyof Measured, string> = {
  wellheadTempC: "measured_wellhead_temp_c",
  pumpLoadKN: "measured_pump_load_kn",
  flowRateBblD: "measured_flow_rate_bbl_d",
  pumpSpeedSPM: "measured_pump_speed_spm",
  strokeM: "measured_stroke_m",
  daysSinceSteaming: "measured_days_since_steaming",
};

const INFERRED_COLUMNS: Record<keyof Inferred, string> = {
  reservoirTempC: "inferred_reservoir_temp_c",
  viscosityCp: "inferred_viscosity_cp",
  heatedVolumeM3: "inferred_heated_volume_m3",
  heatedRadiusM: "inferred_heated_radius_m",
  safePumpSpeedSPM: "inferred_safe_pump_speed_spm",
  floatingRisk: "inferred_floating_risk",
  inflowRateBblD: "inferred_inflow_rate_bbl_d",
};

const MEASURED_KEYS = Object.keys(MEASURED_COLUMNS) as (keyof Measured)[];
const INFERRED_KEYS = Object.keys(INFERRED_COLUMNS) as (keyof Inferred)[];

const HEADER = [
  "well_id",
  "input_steam_volume_m3",
  "input_steam_quality",
  "input_soak_days",
  "input_stroke_m",
  "input_pump_speed_spm",
  "input_pump_schedule",
  "t_day",
  "phase",
  "phase_day",
  ...MEASURED_KEYS.map((key) => MEASURED_COLUMNS[key]),
  ...INFERRED_KEYS.map((key) => INFERRED_COLUMNS[key]),
];

/** Six significant figures; an empty cell for null or a non-finite value. */
function cell(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "";
  return String(Number(value.toPrecision(6)));
}

/**
 * One row per well per recorded day. input_pump_speed_spm holds a constant
 * speed and is empty for any other schedule; input_pump_schedule names the
 * schedule; the speed on each day is in measured_pump_speed_spm. An optional
 * comment line goes first, starting with "#" (read it with
 * pandas.read_csv(..., comment="#")).
 */
export function cyclesToCsv(results: readonly CycleResult[], comment?: string): string {
  const lines: string[] = [];
  if (comment) lines.push(`# ${comment}`);
  lines.push(HEADER.join(","));
  const width = String(results.length).length;

  results.forEach((result, index) => {
    const c = result.config;
    const wellId = `W${String(index + 1).padStart(Math.max(2, width), "0")}`;
    const inputs = [
      cell(c.steamVolumeM3),
      cell(c.steamQuality),
      cell(c.soakDays),
      cell(c.strokeM),
      typeof c.pumpSpeedSPM === "number" ? cell(c.pumpSpeedSPM) : "",
      describeSchedule(c.pumpSpeedSPM),
    ];
    for (const day of result.days) {
      lines.push(
        [
          wellId,
          ...inputs,
          cell(day.t),
          day.phase,
          cell(day.phaseDay),
          ...MEASURED_KEYS.map((key) => cell(day.measured[key])),
          ...INFERRED_KEYS.map((key) => cell(day.inferred[key])),
        ].join(","),
      );
    }
  });
  return lines.join("\n") + "\n";
}

/** Random wells, simulated and written as CSV. The seed goes in the first line. */
export function batchCsv(count: number, seed: number, p: ModelParams = DEFAULT_PARAMS): string {
  const results = randomWells(count, seed).map((config) => simulateCycle(config, p));
  return cyclesToCsv(results, `baghewala-twin physics batch; seed=${seed}; wells=${count}`);
}

export type SweepTarget = { kind: "input"; key: InputKey } | { kind: "param"; key: ParamKey };

export interface SweepPoint {
  value: number;
  result: CycleResult;
}

/** Runs one cycle per value, changing one input or one model parameter. */
export function sweep(
  base: SerializableWellConfig,
  target: SweepTarget,
  values: readonly number[],
  p: ModelParams = DEFAULT_PARAMS,
): SweepPoint[] {
  return values.map((value) => {
    const config = target.kind === "input" ? { ...base, [target.key]: value } : base;
    const params = target.kind === "param" ? { ...p, [target.key]: value } : p;
    return { value, result: simulateCycle(config, params) };
  });
}
