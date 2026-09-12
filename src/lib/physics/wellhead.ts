// Equation 8: wellhead temperature (Ramey, 1962). [Assumption, tier D]
//
//   Twh = Tg0 + gG·A − (Tg0 + gG·D + gG·A − Tr) · e^(−D/A)
//   gG = (Ti − Tg0) / D,   A = a · q
//
// Oil leaves the reservoir at Tr and cools towards the geotherm as it rises.
// A low rate gives the oil more time to lose heat, so it arrives cooler.

import { DEFAULT_PARAMS } from "./parameters";
import type { ModelParams } from "./types";

/** Temperature of the produced oil at the wellhead, °C. null when q is 0. */
export function wellheadTemperature(
  flowRateBblD: number,
  reservoirTempC: number,
  p: ModelParams = DEFAULT_PARAMS,
): number | null {
  if (!(flowRateBblD > 0)) return null;
  const gradient = (p.reservoirTempC - p.surfaceTempC) / p.wellDepthM; // °C/m
  const relaxationM = p.rameyLengthPerRate * flowRateBblD;
  const depth = p.wellDepthM;
  return (
    p.surfaceTempC +
    gradient * relaxationM -
    (p.surfaceTempC + gradient * depth + gradient * relaxationM - reservoirTempC) *
      Math.exp(-depth / relaxationM)
  );
}
