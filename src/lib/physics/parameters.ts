// Every number the model uses is defined here, once. The simulator, the
// research page and the verification script all read from this file.
//
// Source: merged technical reference (SIH26120), revised 12 September 2026,
// section 4 "Equations" and section 5 "Parameters". "TR" below means that
// document.

import type {
  InputKey,
  InputRange,
  ModelParams,
  ParamInfo,
  ParamKey,
  ParamKind,
  ResolvedWellConfig,
  Tier,
} from "./types";

// Symbols use "_" for a subscript: "T_s" is T with subscript s. The UI turns
// this into real subscripts.

export const TIER_INFO: Record<Tier, { label: string; description: string }> = {
  A: { label: "Tier A", description: "Stated in the SIH problem statement." },
  B: { label: "Tier B", description: "Published Oil India or SPE data." },
  D: { label: "Tier D", description: "Our assumption. It needs calibration." },
  std: { label: "std", description: "Physical constant or steam-table value." },
};

export const KIND_INFO: Record<ParamKind, { label: string; description: string }> = {
  field: { label: "Field value", description: "Reported for Baghewala." },
  constant: { label: "Constant", description: "Physics, steam tables or material data." },
  assumption: {
    label: "Assumption",
    description: "Chosen by us and not fitted to any target. Field data must replace it.",
  },
  calibration: {
    label: "Calibration",
    description: "Set so the model reproduces one documented number.",
  },
};

// Unit conversions. These never change.
export const KELVIN_OFFSET = 273.15; // °C to K
export const PA_S_PER_CP = 0.001; // 1 cP = 0.001 Pa·s
export const M3_PER_BBL = 0.159;
export const MINUTES_PER_DAY = 1440;
export const HOURS_PER_DAY = 24;

export const DEFAULT_PARAMS: ModelParams = Object.freeze({
  // Equation 1
  waterDensity: 1000,
  latentHeat: 1716.6,
  waterHeatCapacity: 4.187,
  rockHeatCapacity: 2350,
  thermalEfficiency: 0.5,
  reservoirTempC: 50,
  steamTempC: 250,
  netThicknessM: 9.92,
  // Equation 2
  tauRefDays: 30,
  // Equation 3
  oilDensity: 963,
  anchorViscosityCp: 11500,
  anchorTempC: 50,
  waltherB: 3.5,
  // Equation 4
  coldRateBblD: 10,
  wellRadiusM: 0.1,
  drainageRadiusM: 100,
  plungerDiameterM: 0.04445, // 1.75 in
  volumetricEfficiency: 0.8,
  // Equation 5
  steelDensity: 7850,
  gravity: 9.81,
  rodDiameterM: 0.0222, // 7/8 in
  tubingDiameterM: 0.062, // 2 7/8 in tubing, inside diameter
  mechanicalMaxSPM: 12,
  // Equation 7
  steamRateKgH: 3100,
  injectionTauDays: 1,
  condensedFraction: 0.5,
  // Equation 8
  surfaceTempC: 30,
  wellDepthM: 1150,
  rameyLengthPerRate: 20,
  pumpDepthM: 1100,
  millsFactor: 1790,
});

/** Returns the default parameters with some values replaced. */
export function withParams(overrides: Partial<ModelParams>): ModelParams {
  return Object.freeze({ ...DEFAULT_PARAMS, ...overrides });
}

export const PARAM_INFO: Record<ParamKey, ParamInfo> = {
  waterDensity: {
    symbol: "ρ_w",
    name: "Water density",
    unit: "kg/m³",
    tier: "std",
    kind: "constant",
    equations: [1, 7],
    source: "TR §5",
    note: "Converts the cold-water-equivalent steam volume to mass.",
  },
  latentHeat: {
    symbol: "L",
    name: "Latent heat of steam at 250 °C",
    unit: "kJ/kg",
    tier: "std",
    kind: "constant",
    equations: [1, 7],
    source: "Steam tables; TR §5",
  },
  waterHeatCapacity: {
    symbol: "c_p",
    name: "Specific heat of water",
    unit: "kJ/(kg·K)",
    tier: "std",
    kind: "constant",
    equations: [1, 7],
    source: "TR §5",
  },
  rockHeatCapacity: {
    symbol: "M_R",
    name: "Rock volumetric heat capacity",
    unit: "kJ/(m³·K)",
    tier: "D",
    kind: "assumption",
    equations: [1],
    source: "TR §5",
  },
  thermalEfficiency: {
    symbol: "η",
    name: "Thermal efficiency",
    unit: "fraction",
    tier: "D",
    kind: "assumption",
    equations: [1],
    source: "TR §5 (range 0.4–0.7)",
    note: "Share of the injected heat that stays in the heated rock. Field data must replace it.",
    range: [0.4, 0.7],
  },
  reservoirTempC: {
    symbol: "T_i",
    name: "Native reservoir temperature",
    unit: "°C",
    tier: "B",
    kind: "field",
    equations: [1, 2, 4, 7, 8],
    source: "Oil India bottomhole temperature; TR §5",
    note: "The problem statement gives 46–48 °C. The model uses the field value.",
  },
  steamTempC: {
    symbol: "T_s",
    name: "Steam temperature, effective downhole",
    unit: "°C",
    tier: "D",
    kind: "assumption",
    equations: [1, 2, 7],
    source: "TR eq 1",
    note: "Surface steam is 280–305 °C. The downhole value after wellbore losses is not reported.",
    range: [200, 300], // literature range, TR §5
  },
  netThicknessM: {
    symbol: "h",
    name: "Net heated thickness",
    unit: "m",
    tier: "D",
    kind: "calibration",
    equations: [1, 2],
    source: "TR eq 1",
    note: "Back-solved so the worked case gives rh = 11.8 m. Replace with field net pay.",
  },
  tauRefDays: {
    symbol: "τ_ref",
    name: "Cooling constant at the reference heated radius",
    unit: "days",
    tier: "D",
    kind: "assumption",
    equations: [2],
    source: "TR eq 2",
    note: "τ is 30 days when the heated radius equals the worked radius.",
  },
  oilDensity: {
    symbol: "ρ_o",
    name: "Oil density",
    unit: "kg/m³",
    tier: "D",
    kind: "assumption",
    equations: [3, 5, 8],
    source: "TR §5 (SG 0.963, about 15.4 °API, inside the field range)",
  },
  anchorViscosityCp: {
    symbol: "μ_anchor",
    name: "Oil viscosity at the anchor temperature",
    unit: "cP",
    tier: "B",
    kind: "field",
    equations: [3],
    source: "Oil India, 10,000–13,000 cP at 50 °C; TR eq 3",
    note: "The midpoint of the reported range, not a single measurement.",
  },
  anchorTempC: {
    symbol: "T_anchor",
    name: "Temperature of the viscosity anchor",
    unit: "°C",
    tier: "B",
    kind: "field",
    equations: [3],
    source: "TR eq 3",
  },
  waltherB: {
    symbol: "B",
    name: "Walther slope",
    unit: "—",
    tier: "D",
    kind: "assumption",
    equations: [3],
    source: "TR eq 3",
    note: "Needs a second viscosity measurement at another temperature (open item 1).",
    range: [3.2, 3.8], // the study range in TR open item 1
  },
  coldRateBblD: {
    symbol: "q_cold",
    name: "Unstimulated (cold) oil rate per well",
    unit: "bbl/d",
    tier: "D",
    kind: "calibration",
    equations: [4],
    source: "TR eq 4",
    note: "Set so the worked case lands inside the reported SOR band (3.0–5.2): SOR 4.27.",
  },
  wellRadiusM: {
    symbol: "r_w",
    name: "Well radius",
    unit: "m",
    tier: "D",
    kind: "assumption",
    equations: [4],
    source: "TR §5",
  },
  drainageRadiusM: {
    symbol: "r_e",
    name: "Drainage radius",
    unit: "m",
    tier: "D",
    kind: "assumption",
    equations: [4],
    source: "TR §5",
  },
  plungerDiameterM: {
    symbol: "d_p",
    name: "Plunger diameter (1.75 in)",
    unit: "m",
    tier: "D",
    kind: "assumption",
    equations: [4, 8],
    source: "TR eq 4",
  },
  volumetricEfficiency: {
    symbol: "η_v",
    name: "Pump volumetric efficiency",
    unit: "fraction",
    tier: "D",
    kind: "assumption",
    equations: [4],
    source: "TR eq 4",
  },
  steelDensity: {
    symbol: "ρ_s",
    name: "Steel density",
    unit: "kg/m³",
    tier: "D",
    kind: "constant",
    equations: [5, 8],
    source: "TR §5",
  },
  gravity: {
    symbol: "g",
    name: "Gravity",
    unit: "m/s²",
    tier: "std",
    kind: "constant",
    equations: [5, 8],
    source: "Standard value",
  },
  rodDiameterM: {
    symbol: "d_r",
    name: "Rod diameter (7/8 in)",
    unit: "m",
    tier: "D",
    kind: "assumption",
    equations: [5, 8],
    source: "TR §5",
  },
  tubingDiameterM: {
    symbol: "d_t",
    name: "Tubing inside diameter (2 7/8 in)",
    unit: "m",
    tier: "D",
    kind: "assumption",
    equations: [5, 8],
    source: "TR §5",
  },
  mechanicalMaxSPM: {
    symbol: "N_mech",
    name: "Mechanical pump-speed ceiling",
    unit: "SPM",
    tier: "D",
    kind: "assumption",
    equations: [5],
    source: "TR eq 5 (the top of the N range)",
  },
  steamRateKgH: {
    symbol: "ṁ_s",
    name: "Steam injection rate",
    unit: "kg/h",
    tier: "B",
    kind: "field",
    equations: [7],
    source: "Oil India; TR eq 7",
  },
  injectionTauDays: {
    symbol: "τ_inj",
    name: "Heating constant during injection",
    unit: "days",
    tier: "D",
    kind: "assumption",
    equations: [7],
    source: "TR eq 7",
  },
  condensedFraction: {
    symbol: "f_c",
    name: "Share of steam condensed by the end of injection",
    unit: "fraction",
    tier: "D",
    kind: "assumption",
    equations: [7],
    source: "TR eq 7",
  },
  surfaceTempC: {
    symbol: "T_g,0",
    name: "Surface (ground) temperature",
    unit: "°C",
    tier: "D",
    kind: "assumption",
    equations: [8],
    source: "TR eq 8",
  },
  wellDepthM: {
    symbol: "D",
    name: "Well depth, Jodhpur Sandstone",
    unit: "m",
    tier: "B",
    kind: "field",
    equations: [8],
    source: "Oil India; TR §5",
  },
  rameyLengthPerRate: {
    symbol: "a",
    name: "Ramey relaxation length per unit rate",
    unit: "m per bbl/d",
    tier: "D",
    kind: "assumption",
    equations: [8],
    source: "TR eq 8",
  },
  pumpDepthM: {
    symbol: "D_p",
    name: "Pump setting depth",
    unit: "m",
    tier: "D",
    kind: "assumption",
    equations: [4, 8],
    source: "TR eq 4",
  },
  millsFactor: {
    symbol: "1790",
    name: "Mills acceleration factor (S in metres)",
    unit: "m·min⁻²",
    tier: "std",
    kind: "constant",
    equations: [8],
    source: "Mills; TR eq 8",
  },
};

// Operator inputs. Ranges from TR §5 as narrowed in the 12 September 2026
// review. Defaults are the worked case where one exists.
export const INPUT_RANGES: Record<InputKey, InputRange> = {
  steamVolumeM3: {
    symbol: "V_s",
    name: "Steam volume",
    unit: "m³ CWE",
    min: 500,
    max: 4000,
    step: 50,
    defaultValue: 2000,
    tier: "B",
    source: "TR §5",
    fieldRange: [1040, 1560],
  },
  steamQuality: {
    symbol: "x",
    name: "Steam quality",
    unit: "fraction",
    min: 0.6,
    max: 0.8,
    step: 0.01,
    defaultValue: 0.7,
    tier: "B",
    source: "TR §5",
    fieldRange: [0.6, 0.7],
  },
  soakDays: {
    symbol: "t_soak",
    name: "Soak time",
    unit: "days",
    min: 3,
    max: 14,
    step: 1,
    defaultValue: 7, // tier D: no default in the documents
    tier: "B",
    source: "TR §5",
  },
  strokeM: {
    symbol: "S",
    name: "Stroke length",
    unit: "m",
    min: 1,
    max: 3,
    step: 0.1,
    defaultValue: 2.5,
    tier: "D",
    source: "TR §5",
  },
  pumpSpeedSPM: {
    symbol: "N",
    name: "Pump speed",
    unit: "SPM",
    min: 2,
    max: 12,
    step: 0.1,
    defaultValue: 6, // tier D: the worked case
    tier: "D",
    source: "TR §5",
  },
  productionDays: {
    symbol: "t_cut",
    name: "Production length before re-steaming",
    unit: "days",
    min: 60,
    max: 365,
    step: 1,
    defaultValue: 120,
    tier: "D",
    source: "TR §5 and eq 7",
  },
};

// Settings for the pump presets (types.ts, PumpPreset). [Assumption, tier D]
// The documents give no values; these are our choice for the simulator and
// the synthetic batch export.
export const PRESET_RANGES = {
  fraction: {
    symbol: "f",
    name: "Share of the safe speed",
    unit: "fraction",
    min: 0.7,
    max: 1,
    step: 0.01,
    defaultValue: 0.9,
    tier: "D",
    source: "Our choice; not in the documents",
  },
  holdFromDay: {
    symbol: "t_hold",
    name: "Production day the operator stops following the limit",
    unit: "day",
    min: 0,
    max: 120,
    step: 1,
    defaultValue: 60,
    tier: "D",
    source: "Our choice; not in the documents",
  },
} satisfies Record<string, InputRange>;

/** The worked case in TR §4. The verification script checks against it. */
export const REFERENCE_CASE: ResolvedWellConfig = Object.freeze({
  steamVolumeM3: 2000,
  steamQuality: 0.7,
  soakDays: INPUT_RANGES.soakDays.defaultValue,
  strokeM: 2.5,
  pumpSpeedSPM: 6,
  productionDays: 120,
});
