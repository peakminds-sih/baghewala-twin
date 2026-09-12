// Equation 5: viscosity to pump-speed limit. [Assumption: static force
// balance, needs calibration against failure history (open item 2)]
//
//   vf   = (ρs − ρo) · g · dr² · ln(dt/dr) / (8μ)     available fall speed, m/s
//   Nmax = min(30 · vf / S, Nmech)
//
// The rods must fall one stroke in half a pump cycle (30/N seconds). If the
// required speed S·N/30 exceeds vf, the string goes slack: the rods float.
//
// The peak polished-rod load (equation 8, pump load) is here too, because it
// uses the same rod weight and the same viscous drag.

import { DEFAULT_PARAMS, PA_S_PER_CP } from "./parameters";
import { plungerArea } from "./inflow";
import { productionDayAtTemperature } from "./temperature";
import type { ModelParams } from "./types";
import { temperatureAtViscosity } from "./viscosity";

function rodDragFactor(p: ModelParams): number {
  return Math.log(p.tubingDiameterM / p.rodDiameterM);
}

/** Speed at which the rods can fall through oil of the given viscosity, m/s. */
export function rodFallSpeed(viscosity: number, p: ModelParams = DEFAULT_PARAMS): number {
  const muPaS = viscosity * PA_S_PER_CP;
  return (
    ((p.steelDensity - p.oilDensity) * p.gravity * p.rodDiameterM ** 2 * rodDragFactor(p)) /
    (8 * muPaS)
  );
}

/** K in Nmax = K / (μ_cP · S). 128,240 with the default parameters. */
export function floatConstant(p: ModelParams = DEFAULT_PARAMS): number {
  return 30 * rodFallSpeed(1, p); // 30 · vf at 1 cP
}

/** Maximum safe pump speed, SPM. */
export function safePumpSpeed(viscosity: number, strokeM: number, p: ModelParams = DEFAULT_PARAMS): number {
  return Math.min(floatConstant(p) / (viscosity * strokeM), p.mechanicalMaxSPM);
}

/** Floating risk: the set speed as a share of the safe speed. Above 1 the rods float. */
export function floatingRisk(pumpSpeedSPM: number, safeSpeedSPM: number): number {
  return pumpSpeedSPM / safeSpeedSPM;
}

/**
 * The production day when the viscosity-based safe speed K/(μS) falls to
 * speedSPM. Exact, not rounded to a whole day. Returns 0 if it is already
 * below speedSPM at steam temperature, and null if it never falls that far.
 *
 * With speedSPM = Nmech this is the day the limit starts to bind. With the
 * set speed N it is the day the rods start to float.
 */
export function productionDayAtSafeSpeed(
  speedSPM: number,
  strokeM: number,
  tauDays: number,
  p: ModelParams = DEFAULT_PARAMS,
): number | null {
  const viscosityAtLimit = floatConstant(p) / (speedSPM * strokeM);
  return productionDayAtTemperature(temperatureAtViscosity(viscosityAtLimit, p), tauDays, p);
}

/** Buoyant weight of the rod string down to the pump, kN. */
export function buoyantRodWeight(p: ModelParams = DEFAULT_PARAMS): number {
  const rodAreaM2 = (Math.PI * p.rodDiameterM ** 2) / 4;
  return ((p.steelDensity - p.oilDensity) * p.gravity * rodAreaM2 * p.pumpDepthM) / 1000;
}

/**
 * Peak polished-rod load (equation 8). [Assumption, tier D]
 *
 *   PPRL = Wrb·(1 + S·N²/1790) + ρo·g·Dp·Ap + 2π·μ·v·Dp / ln(dt/dr)
 *
 * Rod weight with the Mills acceleration factor, plus the fluid load on the
 * plunger of a pumped-off well, plus viscous drag on the rods during the
 * upstroke at the mean speed v = S·N/30. All loads in kN.
 */
export function polishedRodLoad(
  viscosity: number,
  strokeM: number,
  pumpSpeedSPM: number,
  p: ModelParams = DEFAULT_PARAMS,
): { rodKN: number; fluidKN: number; frictionKN: number; totalKN: number } {
  const rodKN = buoyantRodWeight(p) * (1 + (strokeM * pumpSpeedSPM ** 2) / p.millsFactor);
  const fluidKN = (p.oilDensity * p.gravity * p.pumpDepthM * plungerArea(p)) / 1000;
  const meanRodSpeed = (strokeM * pumpSpeedSPM) / 30; // m/s
  const frictionKN =
    (2 * Math.PI * viscosity * PA_S_PER_CP * meanRodSpeed * p.pumpDepthM) / rodDragFactor(p) / 1000;
  return { rodKN, fluidKN, frictionKN, totalKN: rodKN + fluidKN + frictionKN };
}
