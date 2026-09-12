// Types for the physics module. No values live here; see parameters.ts.

/**
 * Where a value comes from, as in the technical reference, section 5.
 * A: SIH problem statement. B: published Oil India or SPE data.
 * D: our assumption; it needs calibration. std: physical constant or
 * steam-table value.
 */
export type Tier = "A" | "B" | "D" | "std";

/**
 * How a value was chosen. This is separate from the tier.
 * - field: reported for Baghewala.
 * - constant: physics, steam tables or material data.
 * - assumption: chosen by us and not fitted to any target. Field data must
 *   replace it.
 * - calibration: set so that the model reproduces one documented number.
 *   The target is named in the parameter's note.
 */
export type ParamKind = "field" | "constant" | "assumption" | "calibration";

export type Phase = "injection" | "soak" | "production";

/** From this production day on, run at this speed. */
export interface PumpStep {
  fromProductionDay: number;
  spm: number;
}

/**
 * Named pump-speed presets. Both follow the safe speed Nmax, which falls as
 * the zone cools. [Assumption, tier D: these model operator behaviour]
 * - follow-limit: run at `fraction` × Nmax every day. The recommendation is
 *   followed.
 * - follow-then-hold: follow the limit until `holdFromDay`, then keep that
 *   day's speed. The recommendation is ignored while Nmax keeps falling. This
 *   is the case that floats the rods and breaks them.
 * Speeds are held inside the pump range (2 SPM to the mechanical ceiling).
 */
export type PumpPreset =
  | { kind: "follow-limit"; fraction: number }
  | { kind: "follow-then-hold"; fraction: number; holdFromDay: number };

/** A schedule made of data only, so it can be sent to a Web Worker. */
export type SerializablePumpSchedule =
  | number
  | { kind: "steps"; steps: readonly PumpStep[] }
  | PumpPreset;

/** Speed on a production day, given that day's safe speed. Main thread only:
 *  a function cannot be sent to a Web Worker. */
export type PumpSpeedFunction = (productionDay: number, safeSpeedSPM: number) => number;

/**
 * Pump speed in strokes per minute over the production phase. Production
 * day 0 is the first day after soak. Use a number for a constant speed, a
 * list of steps, a preset, or (on the main thread only) a function.
 */
export type PumpSchedule = SerializablePumpSchedule | PumpSpeedFunction;

/** The operator's choices for one steam cycle. */
export interface WellConfig {
  steamVolumeM3: number; // Vs, cold-water equivalent
  steamQuality: number; // x, fraction
  soakDays: number;
  strokeM: number; // S, polished-rod stroke
  pumpSpeedSPM: PumpSchedule; // N
  productionDays?: number; // production length before re-steaming; default 120
}

export type ResolvedWellConfig = Required<WellConfig>;

/** A configuration that can cross a worker boundary (no functions). */
export type SerializableWellConfig = WellConfig & { pumpSpeedSPM: SerializablePumpSchedule };

/** Every model constant that a caller may change. Defaults: DEFAULT_PARAMS. */
export interface ModelParams {
  // Equation 1: steam to heated zone
  readonly waterDensity: number; // kg/m³
  readonly latentHeat: number; // kJ/kg, at 250 °C
  readonly waterHeatCapacity: number; // kJ/(kg·K)
  readonly rockHeatCapacity: number; // kJ/(m³·K)
  readonly thermalEfficiency: number; // η, fraction
  readonly reservoirTempC: number; // Ti
  readonly steamTempC: number; // Ts, effective downhole
  readonly netThicknessM: number; // h
  // Equation 2: cooling
  readonly tauRefDays: number; // τ at the reference heated radius
  // Equation 3: viscosity
  readonly oilDensity: number; // kg/m³; SG = oilDensity / waterDensity
  readonly anchorViscosityCp: number;
  readonly anchorTempC: number;
  readonly waltherB: number;
  // Equation 4: inflow and pump
  readonly coldRateBblD: number; // q_cold
  readonly wellRadiusM: number; // rw
  readonly drainageRadiusM: number; // re
  readonly plungerDiameterM: number;
  readonly volumetricEfficiency: number; // ηv
  // Equation 5: rod fall and safe speed
  readonly steelDensity: number; // kg/m³
  readonly gravity: number; // m/s²
  readonly rodDiameterM: number; // dr
  readonly tubingDiameterM: number; // dt, inside diameter
  readonly mechanicalMaxSPM: number;
  // Equation 7: phases
  readonly steamRateKgH: number;
  readonly injectionTauDays: number;
  readonly condensedFraction: number; // fc
  // Equation 8: measured signals
  readonly surfaceTempC: number; // Tg,0
  readonly wellDepthM: number; // D
  readonly rameyLengthPerRate: number; // a, m per bbl/d
  readonly pumpDepthM: number; // Dp
  readonly millsFactor: number; // acceleration factor denominator, S in metres
}

export type ParamKey = keyof ModelParams;

export interface ParamInfo {
  symbol: string;
  name: string;
  unit: string;
  tier: Tier;
  kind: ParamKind;
  equations: number[];
  source: string;
  note?: string;
  /** The range the documents give for this value, for sensitivity studies.
   *  The model uses the default value; the range is not a simulator input. */
  range?: readonly [number, number];
}

export type InputKey = keyof ResolvedWellConfig;

export interface InputRange {
  symbol: string;
  name: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  tier: Tier;
  source: string;
  /** The part of the range seen in Baghewala field practice, when narrower. */
  fieldRange?: readonly [number, number];
}

/**
 * Values a sensor or the operator can read at the well. This is the feature
 * side of the ML split: keep inferred values out of it.
 */
export interface Measured {
  wellheadTempC: number | null; // null when the well is not producing
  pumpLoadKN: number | null; // peak polished-rod load; null when the pump is off
  flowRateBblD: number; // surface oil rate q; 0 when the well is not producing
  pumpSpeedSPM: number; // 0 during injection and soak
  strokeM: number;
  daysSinceSteaming: number; // 0 during injection; counts from the end of injection
}

/**
 * Values only the model can give. No sensor reads them. This is the target
 * side of the ML split.
 */
export interface Inferred {
  reservoirTempC: number;
  viscosityCp: number;
  heatedVolumeM3: number;
  heatedRadiusM: number;
  safePumpSpeedSPM: number; // Nmax
  floatingRisk: number; // N / Nmax; 0 when the pump is off
  inflowRateBblD: number; // q_in, what the reservoir can deliver; 0 when shut in
}

export interface DayState {
  t: number; // days from the start of injection
  phase: Phase;
  phaseDay: number; // days since this phase began
  measured: Measured;
  inferred: Inferred;
}

export interface CycleSummary {
  injectionDays: number;
  heatedVolumeM3: number;
  heatedRadiusM: number;
  tauDays: number;
  steamBbl: number; // cold-water equivalent
  cumulativeOilBbl: number; // Np over the production phase
  steamOilRatio: number;
  /** Production day when Nmax first falls below the mechanical ceiling. Exact
   *  (not rounded to a day), independent of N, and may be past the cycle end.
   *  null if it never happens. */
  limitBindsDay: number | null;
  /** First recorded production day with floating risk above 1, or null. */
  floatingStartsDay: number | null;
}

export interface CycleResult {
  config: ResolvedWellConfig;
  params: ModelParams;
  days: DayState[];
  phases: Record<Phase, { startT: number; endT: number }>;
  summary: CycleSummary;
}
