// Equation 3: temperature to viscosity. [Physics: ASTM D341 / Walther, one
// constant calibrated]
//
//   log10(log10(ν + 0.7)) = A − B · log10(T),   T in K, ν in cSt, μ = ν · SG
//
// Do not replace this with a simple exponential. Heavy-oil viscosity changes
// too steeply between 50 °C and 250 °C for one exponential to hold.

import { DEFAULT_PARAMS, KELVIN_OFFSET } from "./parameters";
import type { ModelParams } from "./types";

/** Oil specific gravity, from oil density. 0.963 by default. */
export function specificGravity(p: ModelParams = DEFAULT_PARAMS): number {
  return p.oilDensity / p.waterDensity;
}

/**
 * Walther constant A. [Calibration] It is computed so the curve passes
 * through the anchor (11,500 cP at 50 °C) for the current B. It is not
 * rounded: rounding to 9.394 moves the anchor to 11,522 cP.
 */
export function waltherA(p: ModelParams = DEFAULT_PARAMS): number {
  const anchorCSt = p.anchorViscosityCp / specificGravity(p);
  return (
    Math.log10(Math.log10(anchorCSt + 0.7)) +
    p.waltherB * Math.log10(p.anchorTempC + KELVIN_OFFSET)
  );
}

/** Dynamic viscosity of the oil at tempC, cP. */
export function viscosityCp(tempC: number, p: ModelParams = DEFAULT_PARAMS): number {
  const inner = waltherA(p) - p.waltherB * Math.log10(tempC + KELVIN_OFFSET);
  const kinematicCSt = Math.pow(10, Math.pow(10, inner)) - 0.7;
  return kinematicCSt * specificGravity(p);
}

/** The inverse of viscosityCp: the temperature where the oil has viscosityCp, °C. */
export function temperatureAtViscosity(viscosity: number, p: ModelParams = DEFAULT_PARAMS): number {
  const kinematicCSt = viscosity / specificGravity(p);
  const log10Kelvin = (waltherA(p) - Math.log10(Math.log10(kinematicCSt + 0.7))) / p.waltherB;
  return Math.pow(10, log10Kelvin) - KELVIN_OFFSET;
}
