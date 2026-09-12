// Checks the physics module against the worked numbers in the corrected
// documents (revised 12 September 2026, second round of fixes included). Prints actual against expected as a
// table. Expected values are copied from the documents as written; do not
// change them to make a check pass.
//
// Run: npm run verify:physics
//
// A check passes when the actual value, rounded to the precision the document
// states, equals the expected value. Where a document rounds to tens
// ("2,050 bbl") the tolerance is given explicitly.
//
// TR = technical reference, VR = variable relationships, section numbers as
// in the documents.

import {
  DEFAULT_PARAMS,
  REFERENCE_CASE,
  buoyantRodWeight,
  coolingTimeConstant,
  floatConstant,
  heatedZone,
  inflowCeilingRatio,
  injectionDays,
  injectionHeatFraction,
  plungerArea,
  polishedRodLoad,
  productionDayAtSafeSpeed,
  pumpCapacity,
  simulateCycle,
  steamEnthalpy,
  tauInfinity,
  temperatureAtViscosity,
  viscosityCp,
  waltherA,
  withParams,
} from "../src/lib/physics";
import type { DayState, WellConfig } from "../src/lib/physics";

interface Row {
  group: string;
  check: string;
  source: string;
  expected: string;
  actual: number;
  pass: boolean;
  tolerance: number;
}

const rows: Row[] = [];

function decimalsOf(text: string): number {
  const dot = text.indexOf(".");
  return dot === -1 ? 0 : text.length - dot - 1;
}

function check(group: string, name: string, source: string, expected: string, actual: number, tolerance?: number): void {
  const tol = tolerance ?? 0.5 * 10 ** -decimalsOf(expected);
  const pass = Number.isFinite(actual) && Math.abs(actual - Number(expected)) <= tol + 1e-9;
  rows.push({ group, check: name, source, expected, actual, pass, tolerance: tol });
}

// ---------------------------------------------------------------- worked case
const base: WellConfig = { ...REFERENCE_CASE };
const cycle = simulateCycle(base);
const production = cycle.days.filter((d) => d.phase === "production");
const onDay = (day: number): DayState => {
  const state = production.find((d) => d.phaseDay === day);
  if (!state) throw new Error(`No production day ${day}`);
  return state;
};
const zone = heatedZone(2000, 0.7);
const tau = cycle.summary.tauDays;
const tableDays = [0, 30, 60, 90, 120] as const;

// Equation 1
check("Eq 1 heated zone", "Steam enthalpy H (kJ/kg)", "TR eq 1", "2039", steamEnthalpy(0.7));
check("Eq 1 heated zone", "Heated volume Vh (m³)", "TR eq 1", "4338", zone.volumeM3);
check("Eq 1 heated zone", "Heated radius rh (m)", "TR eq 1", "11.8", zone.radiusM);
check("Eq 1 heated zone", "rh at 500 m³ (m)", "VR §6", "5.9", heatedZone(500, 0.7).radiusM);
check("Eq 1 heated zone", "rh at 4,000 m³ (m)", "VR §6", "16.7", heatedZone(4000, 0.7).radiusM);

// Equation 2
check("Eq 2 temperature", "τ∞ (days)", "TR eq 2", "55.2", tauInfinity());
check("Eq 2 temperature", "τ, worked case (days, 'exactly 30')", "TR eq 2", "30.000", tau);
check("Eq 2 temperature", "τ at 500 m³ (days)", "TR eq 2", "21", coolingTimeConstant(heatedZone(500, 0.7).radiusM));
check("Eq 2 temperature", "τ at 4,000 m³ (days)", "TR eq 2", "35", coolingTimeConstant(heatedZone(4000, 0.7).radiusM));
check("Eq 2 temperature", "Excess halves every 0.69τ (days)", "VR §4", "21", Math.LN2 * tau);
const tableT = ["250.0", "123.6", "77.1", "60.0", "53.7"];
tableDays.forEach((day, i) =>
  check("Eq 2 temperature", `T, production day ${day} (°C)`, "TR worked table", tableT[i], onDay(day).inferred.reservoirTempC),
);

// Equation 3
check("Eq 3 viscosity", "Walther A (computed, not rounded)", "TR eq 3", "9.3933", waltherA());
check("Eq 3 viscosity", "μ at 50 °C, the anchor (cP)", "TR eq 3", "11500", viscosityCp(50));
check("Eq 3 viscosity", "μ at 50 °C if A is rounded to 9.394 (cP)", "TR eq 3", "11684", roundedAViscosity());
const tableMu = ["4.8", "93.1", "1148", "4465", "7998"];
tableDays.forEach((day, i) =>
  check("Eq 3 viscosity", `μ, production day ${day} (cP)`, "TR worked table", tableMu[i], onDay(day).inferred.viscosityCp),
);
check("Eq 3 viscosity", "μ(50 °C) / μ(60 °C)", "VR §5", "2.6", viscosityCp(50) / onDay(90).inferred.viscosityCp);
const bLow = withParams({ waltherB: 3.2 });
const bHigh = withParams({ waltherB: 3.8 });
const spread = (tempC: number) => {
  const a = viscosityCp(tempC, bLow);
  const b = viscosityCp(tempC, bHigh);
  return ((Math.max(a, b) - Math.min(a, b)) / Math.min(a, b)) * 100;
};
check("Eq 3 viscosity", "B 3.2–3.8 spread at 50 °C (%), (max−min)/min", "VR §5", "0", spread(50));
check("Eq 3 viscosity", "B 3.2–3.8 spread at 30 °C (%), (max−min)/min", "VR §5", "57", spread(30));
check("Eq 3 viscosity", "B 3.2–3.8 spread at 250 °C (%), (max−min)/min", "VR §5", "78", spread(250));
check("Eq 3 viscosity", "B 3.2–3.8 spread at 77 °C (%), (max−min)/min", "VR §5; TR open item 1", "41", spread(77));
check("Eq 3 viscosity", "B 3.2–3.8 spread at 124 °C (%), (max−min)/min", "VR §5; TR open item 1", "77", spread(124));

// Equation 4
check("Eq 4 production", "Inflow ceiling q_in/q_cold at rh 11.8 m", "TR eq 4", "3.23", inflowCeilingRatio(zone.radiusM));
check("Eq 4 production", "Inflow ceiling at 500 m³ (rh 5.9 m)", "VR §6", "2.4", inflowCeilingRatio(heatedZone(500, 0.7).radiusM));
check("Eq 4 production", "Inflow ceiling at 4,000 m³ (rh 16.7 m)", "VR §6", "3.9", inflowCeilingRatio(heatedZone(4000, 0.7).radiusM));
check("Eq 4 production", "Plunger area Ap (×10⁻³ m²)", "TR eq 4", "1.552", plungerArea() * 1000);
check("Eq 4 production", "Pump capacity, S 2.5 m, N 6 (bbl/d)", "TR eq 4", "168.6", pumpCapacity(2.5, 6));
check("Eq 4 production", "Pump capacity at 4.5 SPM ('about 126', bbl/d)", "VR §6", "126", pumpCapacity(2.5, 4.5));
const tableQ = ["32.3", "31.7", "26.4", "17.3", "12.7"];
tableDays.forEach((day, i) =>
  check("Eq 4 production", `q, production day ${day} (bbl/d)`, "TR worked table", tableQ[i], onDay(day).measured.flowRateBblD),
);
check("Eq 4 production", "Cumulative oil Np, 120 days (bbl)", "TR eq 4", "2946", cycle.summary.cumulativeOilBbl);
check("Eq 4 production", "Steam, cold-water equivalent (bbl)", "TR eq 4", "12579", cycle.summary.steamBbl);
check("Eq 4 production", "SOR", "TR eq 4", "4.27", cycle.summary.steamOilRatio);

// Equation 5
check("Eq 5 safe speed", "K in Nmax = K/(μS) (stated '128,240')", "TR eq 5", "128240", floatConstant(), 5);
const tableNmax = ["12.00", "12.00", "12.00", "11.49", "6.41"];
const tableRisk = ["0.50", "0.50", "0.50", "0.52", "0.94"];
tableDays.forEach((day, i) =>
  check("Eq 5 safe speed", `Nmax, production day ${day} (SPM)`, "TR worked table", tableNmax[i], onDay(day).inferred.safePumpSpeedSPM),
);
tableDays.forEach((day, i) =>
  check("Eq 5 safe speed", `Floating risk, production day ${day}`, "TR worked table", tableRisk[i], onDay(day).inferred.floatingRisk),
);
check("Eq 5 safe speed", "Nmax fully cold, 50 °C (SPM)", "TR eq 5", "4.5", Math.min(floatConstant() / (viscosityCp(50) * 2.5), 12));
check("Eq 5 safe speed", "Limit binds, S 2.5 m (production day)", "Review 12 Sep; TR eq 5", "88.6", cycle.summary.limitBindsDay ?? NaN);
const bindingViscosity = floatConstant() / (12 * 2.5);
check("Eq 5 safe speed", "Viscosity when the limit binds (cP)", "TR eq 5", "4275", bindingViscosity);
check("Eq 5 safe speed", "Temperature when the limit binds (°C)", "TR eq 5", "60.4", temperatureAtViscosity(bindingViscosity));
check("Eq 5 safe speed", "Limit binds, S 1 m (production day)", "VR §6", "169", productionDayAtSafeSpeed(12, 1, tau) ?? NaN);
check("Eq 5 safe speed", "Limit binds, S 3 m (production day)", "VR §6", "83", productionDayAtSafeSpeed(12, 3, tau) ?? NaN);
check("Eq 5 safe speed", "Limit binds, B 3.2 (production day)", "VR §5", "86", productionDayAtSafeSpeed(12, 2.5, tau, bLow) ?? NaN);
check("Eq 5 safe speed", "Limit binds, B 3.8 (production day)", "VR §5", "91", productionDayAtSafeSpeed(12, 2.5, tau, bHigh) ?? NaN);
check("Eq 5 safe speed", "Rods float from, N 6 (first whole day)", "TR worked case", "127", firstFloatingDay(6));
check("Eq 5 safe speed", "Rods float from, N 8 (first whole day)", "TR worked case", "106", firstFloatingDay(8));
check("Eq 5 safe speed", "Safe speed before the cap, day 40 (SPM)", "Review 12 Sep", "212", uncappedSafeSpeed(40));

// Equation 7
check("Eq 7 phases", "Injection length, 2,000 m³ (days)", "TR eq 7", "26.9", injectionDays(2000));
check("Eq 7 phases", "Injection length, 1,040 m³ (days)", "TR eq 7", "14", injectionDays(1040));
check("Eq 7 phases", "Injection length, 1,560 m³ (days)", "TR eq 7", "21", injectionDays(1560));
check("Eq 7 phases", "f_inj, heat share at end of injection", "TR eq 7", "0.705", injectionHeatFraction(0.7));
check("Eq 7 phases", "End state: T at production day 0 = Ts (°C)", "TR eq 7", "250.0", onDay(0).inferred.reservoirTempC);
check("Eq 7 phases", "End state: V at production day 0 = Vh (m³)", "TR eq 7", "4338", onDay(0).inferred.heatedVolumeM3);

// Equation 8
check("Eq 8 signals", "Buoyant rod weight Wrb (kN)", "TR eq 8", "28.8", buoyantRodWeight());
check("Eq 8 signals", "Fluid load on the plunger (kN)", "TR eq 8", "16.1", polishedRodLoad(1, 2.5, 6).fluidKN);
const tableTwh = ["73.0", "51.3", "41.2", "36.2", "34.4"];
const tablePprl = ["46.4", "46.7", "50.2", "61.4", "73.2"];
tableDays.forEach((day, i) =>
  check("Eq 8 signals", `Wellhead T, production day ${day} (°C)`, "TR worked table", tableTwh[i], onDay(day).measured.wellheadTempC ?? NaN),
);
tableDays.forEach((day, i) =>
  check("Eq 8 signals", `Pump load PPRL, production day ${day} (kN)`, "TR worked table", tablePprl[i], onDay(day).measured.pumpLoadKN ?? NaN),
);

// Sensitivities (VR §7)
const withVolume = (v: number) => simulateCycle({ ...base, steamVolumeM3: v }).summary;
const withDays = (n: number) => simulateCycle({ ...base, productionDays: n }).summary;
check("Sensitivities", "Np, 500 m³ (bbl, 'about 2,050')", "VR §7", "2050", withVolume(500).cumulativeOilBbl, 5);
check("Sensitivities", "Np, 2,000 m³ (bbl, 'about 2,950')", "VR §7", "2950", withVolume(2000).cumulativeOilBbl, 5);
check("Sensitivities", "Np, 4,000 m³ (bbl, 'about 3,620')", "VR §7", "3620", withVolume(4000).cumulativeOilBbl, 5);
check("Sensitivities", "SOR, 500 m³", "VR §7", "1.5", withVolume(500).steamOilRatio);
check("Sensitivities", "SOR, 2,000 m³", "VR §7", "4.3", withVolume(2000).steamOilRatio);
check("Sensitivities", "SOR, 4,000 m³", "VR §7", "6.9", withVolume(4000).steamOilRatio);
check("Sensitivities", "SOR, 60 production days", "VR §7", "6.8", withDays(60).steamOilRatio);
check("Sensitivities", "SOR, 120 production days", "VR §7", "4.3", withDays(120).steamOilRatio);
check("Sensitivities", "SOR, 240 production days", "VR §7", "3.0", withDays(240).steamOilRatio);
check("Sensitivities", "SOR, 365 production days", "VR §7", "2.3", withDays(365).steamOilRatio);
check("Sensitivities", "SOR, S 1 m and N 2 (pump-limited)", "VR §7", "5.2", simulateCycle({ ...base, strokeM: 1, pumpSpeedSPM: 2 }).summary.steamOilRatio);
check("Sensitivities", "SOR, B 3.2", "VR §7", "4.35", simulateCycle(base, bLow).summary.steamOilRatio);
check("Sensitivities", "SOR, B 3.8", "VR §7", "4.20", simulateCycle(base, bHigh).summary.steamOilRatio);

// ---------------------------------------------------------------- helpers
function roundedAViscosity(): number {
  // Equation 3 with A fixed at 9.394 instead of the computed value.
  const sg = DEFAULT_PARAMS.oilDensity / DEFAULT_PARAMS.waterDensity;
  const inner = 9.394 - DEFAULT_PARAMS.waltherB * Math.log10(50 + 273.15);
  return (10 ** 10 ** inner - 0.7) * sg;
}

function firstFloatingDay(speed: number): number {
  return simulateCycle({ ...base, pumpSpeedSPM: speed, productionDays: 200 }).summary.floatingStartsDay ?? NaN;
}

function uncappedSafeSpeed(day: number): number {
  const state = simulateCycle({ ...base, productionDays: day }).days.at(-1);
  return floatConstant() / ((state?.inferred.viscosityCp ?? NaN) * 2.5);
}

// ---------------------------------------------------------------- report
function show(actual: number, expected: string): string {
  if (!Number.isFinite(actual)) return String(actual);
  return actual.toFixed(Math.min(decimalsOf(expected) + 2, 6));
}

const lines = [
  "| # | Group | Check | Source | Expected | Actual | Result |",
  "|---|---|---|---|---|---|---|",
  ...rows.map(
    (r, i) =>
      `| ${i + 1} | ${r.group} | ${r.check} | ${r.source} | ${r.expected} | ${show(r.actual, r.expected)} | ${r.pass ? "match" : "**MISMATCH**"} |`,
  ),
];
console.log(lines.join("\n"));
const failed = rows.filter((r) => !r.pass);
console.log(`\n${rows.length - failed.length} of ${rows.length} checks match.`);
if (failed.length > 0) {
  console.log("Mismatches:");
  for (const r of failed) console.log(`- ${r.check}: expected ${r.expected}, actual ${show(r.actual, r.expected)} (${r.source})`);
  process.exitCode = 1;
}
