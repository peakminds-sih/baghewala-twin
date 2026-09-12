// What each equation is, what goes in and what comes out. The simulator uses
// this to show which equation produced each output; the research page uses
// it to list every equation and variable. Pure data, no React.
//
// Formulas are plain text. "_" marks a subscript ("T_s", "r_h,ref") and
// "^( )" a superscript; the UI renders both.

import type { InputKey, ParamKey } from "./types";

export type EquationId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/** Values the model computes. */
export type VariableKey =
  | "steamEnthalpy"
  | "heatedVolumeM3"
  | "heatedRadiusM"
  | "tauDays"
  | "reservoirTempC"
  | "viscosityCp"
  | "inflowRateBblD"
  | "pumpCapacityBblD"
  | "flowRateBblD"
  | "safePumpSpeedSPM"
  | "floatingRisk"
  | "wellheadTempC"
  | "pumpLoadKN"
  | "injectionDays"
  | "daysSinceSteaming"
  | "cumulativeOilBbl"
  | "steamOilRatio";

/**
 * measured: a sensor or the operator can read it (types.ts, Measured).
 * inferred: only the model can give it (types.ts, Inferred).
 * derived: a summary or intermediate value, neither read nor a model state.
 */
export type VariableKind = "measured" | "inferred" | "derived";

export interface VariableInfo {
  symbol: string;
  name: string;
  unit: string;
  kind: VariableKind;
  equation: EquationId;
  /** Digits after the decimal point for display. */
  digits: number;
}

export const VARIABLES: Record<VariableKey, VariableInfo> = {
  steamEnthalpy: { symbol: "H", name: "Heat per kilogram of steam", unit: "kJ/kg", kind: "derived", equation: 1, digits: 0 },
  heatedVolumeM3: { symbol: "V_h", name: "Heated zone volume", unit: "m³", kind: "inferred", equation: 1, digits: 0 },
  heatedRadiusM: { symbol: "r_h", name: "Heated zone radius", unit: "m", kind: "inferred", equation: 1, digits: 1 },
  tauDays: { symbol: "τ", name: "Cooling time constant", unit: "days", kind: "derived", equation: 2, digits: 1 },
  reservoirTempC: { symbol: "T", name: "Reservoir temperature", unit: "°C", kind: "inferred", equation: 2, digits: 1 },
  viscosityCp: { symbol: "μ", name: "Oil viscosity", unit: "cP", kind: "inferred", equation: 3, digits: 1 },
  inflowRateBblD: { symbol: "q_in", name: "Reservoir inflow", unit: "bbl/d", kind: "inferred", equation: 4, digits: 1 },
  pumpCapacityBblD: { symbol: "Q_pump", name: "Pump capacity", unit: "bbl/d", kind: "derived", equation: 4, digits: 1 },
  flowRateBblD: { symbol: "q", name: "Oil rate at the surface", unit: "bbl/d", kind: "measured", equation: 4, digits: 1 },
  safePumpSpeedSPM: { symbol: "N_max", name: "Maximum safe pump speed", unit: "SPM", kind: "inferred", equation: 5, digits: 2 },
  floatingRisk: { symbol: "N/N_max", name: "Floating risk", unit: "", kind: "inferred", equation: 5, digits: 2 },
  wellheadTempC: { symbol: "T_wh", name: "Wellhead temperature", unit: "°C", kind: "measured", equation: 8, digits: 1 },
  pumpLoadKN: { symbol: "PPRL", name: "Peak polished-rod load", unit: "kN", kind: "measured", equation: 8, digits: 1 },
  injectionDays: { symbol: "t_inj", name: "Injection length", unit: "days", kind: "derived", equation: 7, digits: 1 },
  daysSinceSteaming: { symbol: "t_ss", name: "Days since steaming", unit: "days", kind: "measured", equation: 7, digits: 0 },
  cumulativeOilBbl: { symbol: "N_p", name: "Cumulative oil", unit: "bbl", kind: "derived", equation: 4, digits: 0 },
  steamOilRatio: { symbol: "SOR", name: "Steam–oil ratio", unit: "", kind: "derived", equation: 4, digits: 2 },
};

export type EquationTerm =
  | { kind: "input"; key: InputKey }
  | { kind: "variable"; key: VariableKey }
  | { kind: "time" };

export interface EquationInfo {
  id: EquationId;
  title: string;
  /** Physics or assumption, as the technical reference labels it. */
  status: string;
  formula: string[];
  summary: string;
  inputs: EquationTerm[];
  outputs: VariableKey[];
  params: ParamKey[];
  feeds: EquationId[];
  /** false for equation 6, which v1 does not compute. */
  implemented: boolean;
  source: string;
}

export const EQUATIONS: Record<EquationId, EquationInfo> = {
  1: {
    id: 1,
    title: "Steam → heated zone",
    status: "Assumption: reduced-order energy balance",
    formula: [
      "V_h = η · m_s · [x·L + c_p(T_s − T_i)] / [M_R(T_s − T_i)]",
      "r_h = √(V_h / πh)",
    ],
    summary:
      "The heat the steam carries, divided by the heat each cubic metre of rock needs to reach steam temperature, gives the heated rock volume.",
    inputs: [
      { kind: "input", key: "steamVolumeM3" },
      { kind: "input", key: "steamQuality" },
    ],
    outputs: ["steamEnthalpy", "heatedVolumeM3", "heatedRadiusM"],
    params: [
      "waterDensity",
      "latentHeat",
      "waterHeatCapacity",
      "rockHeatCapacity",
      "thermalEfficiency",
      "reservoirTempC",
      "steamTempC",
      "netThicknessM",
    ],
    feeds: [2, 4, 7],
    implemented: true,
    source: "TR eq 1",
  },
  2: {
    id: 2,
    title: "Heated zone and time → temperature",
    status: "Physics; the cooling law is an assumption (tier D)",
    formula: [
      "T(t) = T_i + (T_s − T_i) · e^(−t/τ)",
      "τ = τ_∞ · r_h / (r_h + h),   τ_∞ = τ_ref · (r_h,ref + h) / r_h,ref",
    ],
    summary:
      "After soak the zone cools towards the native temperature. A larger zone has less surface for its volume, so it cools more slowly.",
    inputs: [{ kind: "variable", key: "heatedRadiusM" }, { kind: "time" }],
    outputs: ["tauDays", "reservoirTempC"],
    params: ["tauRefDays", "netThicknessM", "reservoirTempC", "steamTempC"],
    feeds: [3, 8],
    implemented: true,
    source: "TR eq 2",
  },
  3: {
    id: 3,
    title: "Temperature → viscosity",
    status: "Physics: ASTM D341 / Walther, one constant calibrated",
    formula: ["log₁₀(log₁₀(ν + 0.7)) = A − B · log₁₀(T)", "μ = ν · SG,   T in kelvin"],
    summary:
      "Heavy oil thins steeply as it heats. The double-logarithm form holds from 50 °C to 250 °C, where one exponential cannot.",
    inputs: [{ kind: "variable", key: "reservoirTempC" }],
    outputs: ["viscosityCp"],
    params: ["oilDensity", "waterDensity", "anchorViscosityCp", "anchorTempC", "waltherB"],
    feeds: [4, 5, 8],
    implemented: true,
    source: "TR eq 3",
  },
  4: {
    id: 4,
    title: "Viscosity → production",
    status: "Physics; the rate law and pump constants are assumptions (tier D)",
    formula: [
      "q_in = q_cold · ln(r_e/r_w) / [(μ_h/μ_c)·ln(r_h/r_w) + ln(r_e/r_h)]",
      "Q_pump = A_p · S · N · 1440 · η_v",
      "q = min(q_in, Q_pump)",
    ],
    summary:
      "The heated zone and the cold rock beyond it resist flow in series. The surface rate is the smaller of what the reservoir gives and what the pump can lift.",
    inputs: [
      { kind: "variable", key: "viscosityCp" },
      { kind: "variable", key: "heatedRadiusM" },
      { kind: "input", key: "strokeM" },
      { kind: "input", key: "pumpSpeedSPM" },
    ],
    outputs: ["inflowRateBblD", "pumpCapacityBblD", "flowRateBblD", "cumulativeOilBbl", "steamOilRatio"],
    params: ["coldRateBblD", "wellRadiusM", "drainageRadiusM", "plungerDiameterM", "volumetricEfficiency", "reservoirTempC"],
    feeds: [8],
    implemented: true,
    source: "TR eq 4",
  },
  5: {
    id: 5,
    title: "Viscosity → safe pump speed",
    status: "Assumption: static force balance, needs calibration",
    formula: [
      "v_f = (ρ_s − ρ_o) · g · d_r² · ln(d_t/d_r) / (8μ)",
      "N_max = min(30 · v_f / S, N_mech)",
      "risk = N / N_max",
    ],
    summary:
      "The rods must fall one stroke in half a pump cycle. Thick oil slows their fall, so the safe speed drops. Above a risk of 1 the rods float.",
    inputs: [
      { kind: "variable", key: "viscosityCp" },
      { kind: "input", key: "strokeM" },
      { kind: "input", key: "pumpSpeedSPM" },
    ],
    outputs: ["safePumpSpeedSPM", "floatingRisk"],
    params: ["steelDensity", "oilDensity", "gravity", "rodDiameterM", "tubingDiameterM", "mechanicalMaxSPM"],
    feeds: [],
    implemented: true,
    source: "TR eq 5",
  },
  6: {
    id: 6,
    title: "Rod dynamics and card diagnostics",
    status: "Physics: lumped model. Not computed in v1",
    formula: ["M_r·ẍ + C_r·ẋ + K_r·x = F_ext(t)"],
    summary:
      "Predicts a dynamometer card for fault classification. Equation 5 answers the floating question without it.",
    inputs: [],
    outputs: [],
    params: [],
    feeds: [],
    implemented: false,
    source: "TR eq 6",
  },
  7: {
    id: 7,
    title: "CSS phases: injection and soak",
    status: "Assumption, tier D",
    formula: [
      "t_inj = ρ_w · V_s / (ṁ_s · 24)",
      "T(t) = T_i + (T_s − T_i)(1 − e^(−t/τ_inj))",
      "V(t) = f_inj · V_h · t / t_inj,   f_inj = [c_p(T_s − T_i) + f_c·x·L] / H",
    ],
    summary:
      "Injection heats the rock and grows the zone; soak holds it at steam temperature while the rest of the steam condenses. Both end in the state production starts from.",
    inputs: [
      { kind: "input", key: "steamVolumeM3" },
      { kind: "input", key: "steamQuality" },
      { kind: "input", key: "soakDays" },
    ],
    outputs: ["injectionDays", "reservoirTempC", "heatedVolumeM3", "daysSinceSteaming"],
    params: ["steamRateKgH", "injectionTauDays", "condensedFraction"],
    feeds: [],
    implemented: true,
    source: "TR eq 7",
  },
  8: {
    id: 8,
    title: "Measured signals",
    status: "Assumption, tier D",
    formula: [
      "T_wh = T_g,0 + g_G·A − (T_g,0 + g_G·D + g_G·A − T_r) · e^(−D/A),   A = a·q",
      "PPRL = W_rb(1 + S·N²/1790) + ρ_o·g·D_p·A_p + 2π·μ·v·D_p / ln(d_t/d_r)",
    ],
    summary:
      "What a sensor would read: the oil cools as it rises, so a low rate arrives cooler; thick oil drags on the rods and raises the load.",
    inputs: [
      { kind: "variable", key: "flowRateBblD" },
      { kind: "variable", key: "reservoirTempC" },
      { kind: "variable", key: "viscosityCp" },
      { kind: "input", key: "strokeM" },
      { kind: "input", key: "pumpSpeedSPM" },
    ],
    outputs: ["wellheadTempC", "pumpLoadKN"],
    params: [
      "surfaceTempC",
      "wellDepthM",
      "rameyLengthPerRate",
      "pumpDepthM",
      "millsFactor",
      "steelDensity",
      "oilDensity",
      "rodDiameterM",
    ],
    feeds: [],
    implemented: true,
    source: "TR eq 8",
  },
};

export const EQUATION_IDS = Object.keys(EQUATIONS).map(Number) as EquationId[];
