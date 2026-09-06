// Reduced-order model for the Baghewala digital twin.
//
// Every equation and constant traces to the merged technical reference
// (SIH26120), section 4 "Equations" and section 5 "Parameters". The
// production phase has a closed-form temperature decay, so the whole chain
// runs as plain arithmetic — no solver, no dependency.
//
//   steam volume + quality + temperature
//     -> heated zone volume Vh, radius rh          (eq 1)
//     -> cooling time constant tau                 (derived from rh)
//     -> rock temperature T(t)                     (eq 2, closed form)
//     -> oil viscosity mu(t)                       (eq 3, ASTM D341 / Walther)
//   then splits:
//     -> max safe pump speed Nmax(t)              (eq 5)
//     -> oil rate q(t) and cycle SOR              (eq 4, estimate — see note)

export type ModelInputKey =
  | "steamVolume"
  | "steamTemp"
  | "steamQuality"
  | "cycleLength"
  | "strokeLength"
  | "waltherB";

export type ModelInputs = Record<ModelInputKey, number>;

export type ParamMeta = {
  key: ModelInputKey;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  /** Digits after the decimal point when the value is shown. */
  precision: number;
  /** One line under the slider. */
  hint: string;
};

// Ranges from section 5. Defaults are the section-4 worked-example values.
export const PARAMS: ParamMeta[] = [
  {
    key: "steamVolume",
    label: "Steam volume",
    unit: "m³ CWE",
    min: 300,
    max: 12000,
    step: 100,
    precision: 0,
    hint: "Steam injected this cycle. Sets the size of the heated zone.",
  },
  {
    key: "steamTemp",
    label: "Steam temperature",
    unit: "°C",
    min: 200,
    max: 300,
    step: 5,
    precision: 0,
    hint: "Fixes the injected enthalpy and the day-zero rock temperature.",
  },
  {
    key: "steamQuality",
    label: "Steam quality",
    unit: "fraction",
    min: 0.6,
    max: 0.8,
    step: 0.01,
    precision: 2,
    hint: "Dryness at the wellhead. Wetter steam carries less latent heat.",
  },
  {
    key: "cycleLength",
    label: "Cycle length",
    unit: "days",
    min: 60,
    max: 365,
    step: 5,
    precision: 0,
    hint: "Days of production before the next steam cycle.",
  },
  {
    key: "strokeLength",
    label: "Pump stroke",
    unit: "m",
    min: 1,
    max: 3,
    step: 0.1,
    precision: 1,
    hint: "Polished-rod stroke. A longer stroke lowers the safe speed limit.",
  },
  {
    key: "waltherB",
    label: "Walther slope B",
    unit: "—",
    min: 3.2,
    max: 3.8,
    step: 0.05,
    precision: 2,
    hint: "Viscosity-temperature slope. One measured point only, so it is uncertain.",
  },
];

export const DEFAULT_INPUTS: ModelInputs = {
  steamVolume: 2000,
  steamTemp: 250,
  steamQuality: 0.7,
  cycleLength: 120,
  strokeLength: 2.5,
  waltherB: 3.5,
};

// --- Fixed constants (section 5; field values, per "On the conflicting values") ---
const T_RESERVOIR = 50; // °C, native reservoir temperature (field BHT)
const MU_MEASURED = 11500; // cP, the one measured viscosity, at 50 °C
const API = 17.5; // °API, mid field range
const SG = 141.5 / (131.5 + API); // ≈ 0.9497
const RHO_WATER = 1000; // kg/m³, cold-water-equivalent basis for steam mass
const CP_WATER = 4.187; // kJ/(kg·K)
const LATENT_HEAT = 1716.6; // kJ/kg at ~250 °C; tuned to the section-4 worked enthalpy (2039 kJ/kg)
const MR_ROCK = 2350; // kJ/(m³·K), rock volumetric heat capacity (2.35×10⁶ J/m³·K)
const ETA = 0.5; // thermal efficiency (section 5 range 0.4–0.7; worked value)
const NET_PAY = 9.92; // m; tuned so the worked Vh gives rh = 11.8 m

const TAU_REF = 30; // days, worked cooling constant at the reference radius
const RH_REF = 11.8; // m, reference heated-zone radius for the worked tau
const TAU_MIN = 15; // section 5 range for tau
const TAU_MAX = 50;

const N_MECH_MAX = 12; // SPM, mechanical pump-speed ceiling (section 5 range 2–12)

// Equation 5 collapsed to one constant:  Nmax = FLOAT_K / (mu_cP · S)
//   FLOAT_K = 30 · (ρs − ρo) · g · dr² · ln(dt/dr) / (8 · 0.001)
//   ρs 7850, ρo 963, g 9.81, dr 0.0222 m, dt 0.062 m  ->  ≈ 128250
const FLOAT_K = 128250;

// Equation 4 (estimate). Productivity index rises as viscosity falls, so the
// oil rate follows relative mobility mu_ref / mu, held to a deliverability
// ceiling, then throttled when the rod-float limit forces the pump slower.
// Q_REF_BPD is a per-well rate. k·kro and the flowing bottomhole pressure are
// not in the reference, so it is calibrated: it is set so the DEFAULT inputs
// land at SOR ≈ 4.0, mid-range in the reported SOR band of 3.0–5.2.
const MU_PROD_REF = 4465; // cP, the section-4 day-90 worked viscosity
const Q_REF_BPD = 12.5; // bbl/day at MU_PROD_REF (calibration constant)
const Q_MOBILITY_CEILING = 3; // ceiling on mu_ref / mu (reservoir/tubing deliverability)
const M3_PER_BBL = 0.159;

export const MECHANICAL_PUMP_LIMIT = N_MECH_MAX;

export type DayPoint = {
  day: number;
  tempC: number;
  viscosityCp: number;
  /** SPM, after the mechanical ceiling is applied. */
  maxPumpSpeed: number;
  oilRateBpd: number;
};

export type ModelResult = {
  series: DayPoint[];
  heatedZoneVolume: number; // m³
  heatedZoneRadius: number; // m
  coolingConstant: number; // days (tau)
  /** First day the rod-float limit drops below the mechanical ceiling, or null. */
  floatBindsDay: number | null;
  cycleOil: number; // bbl produced over the cycle (Np)
  steamBbl: number; // bbl CWE injected
  sor: number; // steam-oil ratio
  peakOilRate: number; // bbl/day
};

function heatedZone(inputs: ModelInputs): { volume: number; radius: number } {
  const deltaT = inputs.steamTemp - T_RESERVOIR;
  const steamMass = RHO_WATER * inputs.steamVolume; // kg
  const enthalpy = inputs.steamQuality * LATENT_HEAT + CP_WATER * deltaT; // kJ/kg
  const volume = (ETA * steamMass * enthalpy) / (MR_ROCK * deltaT); // m³
  const radius = Math.sqrt(volume / (Math.PI * NET_PAY)); // m
  return { volume, radius };
}

function coolingConstant(radius: number): number {
  const tau = TAU_REF * (radius / RH_REF);
  return Math.min(TAU_MAX, Math.max(TAU_MIN, tau));
}

// ASTM D341 / Walther:  log10(log10(nu + 0.7)) = A − B·log10(T_K)
// A is re-anchored on the one measured point for the current B.
function makeViscosity(waltherB: number): (tempC: number) => number {
  const nuMeasured = MU_MEASURED / SG; // cSt
  const anchorK = T_RESERVOIR + 273.15;
  const A =
    Math.log10(Math.log10(nuMeasured + 0.7)) + waltherB * Math.log10(anchorK);

  return (tempC: number) => {
    const tempK = tempC + 273.15;
    const inner = A - waltherB * Math.log10(tempK);
    const nu = Math.pow(10, Math.pow(10, inner)) - 0.7; // cSt
    return Math.max(nu, 0) * SG; // cP
  };
}

function maxPumpSpeed(viscosityCp: number, strokeLength: number): number {
  const raw = FLOAT_K / (viscosityCp * strokeLength);
  return Math.min(N_MECH_MAX, raw);
}

export function simulate(inputs: ModelInputs): ModelResult {
  const { volume, radius } = heatedZone(inputs);
  const tau = coolingConstant(radius);
  const viscosityAt = makeViscosity(inputs.waltherB);
  const days = Math.max(1, Math.round(inputs.cycleLength));

  const series: DayPoint[] = [];
  let floatBindsDay: number | null = null;
  let cycleOil = 0;
  let peakOilRate = 0;
  let prevRate = 0;

  for (let day = 0; day <= days; day++) {
    const tempC =
      T_RESERVOIR + (inputs.steamTemp - T_RESERVOIR) * Math.exp(-day / tau);
    const viscosityCp = viscosityAt(tempC);
    const nmax = maxPumpSpeed(viscosityCp, inputs.strokeLength);

    if (floatBindsDay === null && nmax < N_MECH_MAX - 1e-6) {
      floatBindsDay = day;
    }

    const mobility = Math.min(MU_PROD_REF / viscosityCp, Q_MOBILITY_CEILING);
    const oilRateBpd = Q_REF_BPD * mobility * (nmax / N_MECH_MAX);

    series.push({ day, tempC, viscosityCp, maxPumpSpeed: nmax, oilRateBpd });
    peakOilRate = Math.max(peakOilRate, oilRateBpd);
    if (day > 0) cycleOil += (prevRate + oilRateBpd) / 2; // trapezoid, 1-day step
    prevRate = oilRateBpd;
  }

  const steamBbl = inputs.steamVolume / M3_PER_BBL;
  const sor = cycleOil > 0 ? steamBbl / cycleOil : Infinity;

  return {
    series,
    heatedZoneVolume: volume,
    heatedZoneRadius: radius,
    coolingConstant: tau,
    floatBindsDay,
    cycleOil,
    steamBbl,
    sor,
    peakOilRate,
  };
}
