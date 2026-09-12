// Equation 4: viscosity to production. [Physics; the rate law and the pump
// constants are assumptions, tier D]
//
// Rate law, Boberg–Lantz two-zone radial flow. The heated zone (rw to rh) and
// the cold zone (rh to re) resist flow in series. Drawdown is constant in v1.
//
//   q_in = q_cold · ln(re/rw) / [ (μh/μc)·ln(rh/rw) + ln(re/rh) ]
//
// Pump displacement:  Q_pump = Ap · S · N · 1440 · ηv   (m³/d)
// Surface rate:       q = min(q_in, Q_pump)

import { DEFAULT_PARAMS, M3_PER_BBL, MINUTES_PER_DAY } from "./parameters";
import type { ModelParams } from "./types";
import { viscosityCp } from "./viscosity";

function checkRadius(heatedRadiusM: number, p: ModelParams): void {
  if (!(heatedRadiusM > p.wellRadiusM && heatedRadiusM < p.drainageRadiusM)) {
    throw new RangeError(
      `Heated radius ${heatedRadiusM} m must be between rw (${p.wellRadiusM} m) and re (${p.drainageRadiusM} m).`,
    );
  }
}

/** Oil inflow the reservoir can deliver, bbl/d. */
export function inflowRate(
  heatedViscosityCp: number,
  heatedRadiusM: number,
  p: ModelParams = DEFAULT_PARAMS,
): number {
  checkRadius(heatedRadiusM, p);
  const coldViscosityCp = viscosityCp(p.reservoirTempC, p); // μc = μ(Ti)
  const heatedResistance =
    (heatedViscosityCp / coldViscosityCp) * Math.log(heatedRadiusM / p.wellRadiusM);
  const coldResistance = Math.log(p.drainageRadiusM / heatedRadiusM);
  return (
    (p.coldRateBblD * Math.log(p.drainageRadiusM / p.wellRadiusM)) /
    (heatedResistance + coldResistance)
  );
}

/**
 * The ceiling on q_in / q_cold when the heated oil is very thin. Only the cold
 * zone then resists flow. 3.23 at rh = 11.8 m.
 */
export function inflowCeilingRatio(heatedRadiusM: number, p: ModelParams = DEFAULT_PARAMS): number {
  checkRadius(heatedRadiusM, p);
  return Math.log(p.drainageRadiusM / p.wellRadiusM) / Math.log(p.drainageRadiusM / heatedRadiusM);
}

/** Plunger cross-section area, m². 1.552 × 10⁻³ for a 1.75 in plunger. */
export function plungerArea(p: ModelParams = DEFAULT_PARAMS): number {
  return (Math.PI * p.plungerDiameterM ** 2) / 4;
}

/** Pump displacement at stroke S (m) and speed N (SPM), bbl/d. v1 uses the
 *  polished-rod stroke for the plunger stroke. */
export function pumpCapacity(strokeM: number, pumpSpeedSPM: number, p: ModelParams = DEFAULT_PARAMS): number {
  const m3PerDay = plungerArea(p) * strokeM * pumpSpeedSPM * MINUTES_PER_DAY * p.volumetricEfficiency;
  return m3PerDay / M3_PER_BBL;
}

/** Surface oil rate: the smaller of inflow and pump capacity, bbl/d. */
export function surfaceRate(
  heatedViscosityCp: number,
  heatedRadiusM: number,
  strokeM: number,
  pumpSpeedSPM: number,
  p: ModelParams = DEFAULT_PARAMS,
): number {
  return Math.min(
    inflowRate(heatedViscosityCp, heatedRadiusM, p),
    pumpCapacity(strokeM, pumpSpeedSPM, p),
  );
}
