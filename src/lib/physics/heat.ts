// Equation 1: steam to heated zone. [Assumption: reduced-order energy balance]
//
//   Vh = η · ms · [x·L + cp(Ts − Ti)] / [MR (Ts − Ti)],   rh = √(Vh / πh)
//
// The heat the steam carries, divided by the heat each cubic metre of rock
// needs to reach steam temperature, gives the heated rock volume.

import { DEFAULT_PARAMS } from "./parameters";
import type { ModelParams } from "./types";

/** Heat per kilogram of injected steam above reservoir temperature, kJ/kg. */
export function steamEnthalpy(steamQuality: number, p: ModelParams = DEFAULT_PARAMS): number {
  return (
    steamQuality * p.latentHeat +
    p.waterHeatCapacity * (p.steamTempC - p.reservoirTempC)
  );
}

/** Radius of a cylinder of the given volume and height h, m. */
export function heatedRadius(volumeM3: number, p: ModelParams = DEFAULT_PARAMS): number {
  return Math.sqrt(volumeM3 / (Math.PI * p.netThicknessM));
}

/** Heated rock volume (m³) and radius (m) at the end of soak. */
export function heatedZone(
  steamVolumeM3: number,
  steamQuality: number,
  p: ModelParams = DEFAULT_PARAMS,
): { volumeM3: number; radiusM: number } {
  const steamMassKg = p.waterDensity * steamVolumeM3; // cold-water equivalent
  const deltaT = p.steamTempC - p.reservoirTempC;
  const volumeM3 =
    (p.thermalEfficiency * steamMassKg * steamEnthalpy(steamQuality, p)) /
    (p.rockHeatCapacity * deltaT);
  return { volumeM3, radiusM: heatedRadius(volumeM3, p) };
}
