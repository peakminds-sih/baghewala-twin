// Equation 2: thermal balance to temperature. [Physics; the cooling law is an
// assumption, tier D]
//
//   T(t) = Ti + (Ts − Ti) · e^(−t/τ),   t = production day
//   τ = τ∞ · rh / (rh + h),             τ∞ = τref · (rh,ref + h) / rh,ref
//
// τ is proportional to the heated zone's volume-to-surface ratio. It rises
// with steam volume and levels off towards τ∞; there is no hard cap.

import { heatedZone } from "./heat";
import { DEFAULT_PARAMS, REFERENCE_CASE } from "./parameters";
import type { ModelParams } from "./types";

/**
 * The worked-case heated radius (11.80 m). [Calibration] It is computed from
 * the default parameters, not rounded, so τ is exactly τref in the worked
 * case. It stays fixed when a caller changes other parameters, because it
 * defines where τref was set.
 */
export const REFERENCE_RADIUS_M = heatedZone(
  REFERENCE_CASE.steamVolumeM3,
  REFERENCE_CASE.steamQuality,
  DEFAULT_PARAMS,
).radiusM;

/** τ∞, the cooling constant of a very large heated zone, days. [Calibration] */
export function tauInfinity(p: ModelParams = DEFAULT_PARAMS): number {
  return (p.tauRefDays * (REFERENCE_RADIUS_M + p.netThicknessM)) / REFERENCE_RADIUS_M;
}

/** Cooling time constant τ for a heated radius, days. */
export function coolingTimeConstant(heatedRadiusM: number, p: ModelParams = DEFAULT_PARAMS): number {
  return (tauInfinity(p) * heatedRadiusM) / (heatedRadiusM + p.netThicknessM);
}

/** Heated-zone temperature on a production day, °C. */
export function productionTemperature(
  productionDay: number,
  tauDays: number,
  p: ModelParams = DEFAULT_PARAMS,
): number {
  return p.reservoirTempC + (p.steamTempC - p.reservoirTempC) * Math.exp(-productionDay / tauDays);
}

/**
 * The inverse of productionTemperature: the production day when the zone has
 * cooled to tempC. Returns 0 at or above Ts, and null at or below Ti (the
 * zone never gets there).
 */
export function productionDayAtTemperature(
  tempC: number,
  tauDays: number,
  p: ModelParams = DEFAULT_PARAMS,
): number | null {
  if (tempC >= p.steamTempC) return 0;
  if (tempC <= p.reservoirTempC) return null;
  return -tauDays * Math.log((tempC - p.reservoirTempC) / (p.steamTempC - p.reservoirTempC));
}
