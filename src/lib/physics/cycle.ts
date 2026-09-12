// Equation 7: one full CSS cycle, day by day. [Assumption, tier D]
//
// Injection: steam heats the rock. T rises towards Ts with a 1-day constant,
//   and the heated volume grows in proportion to the heat injected.
// Soak: the well is shut in. T holds at Ts while the rest of the steam
//   condenses, and the volume grows linearly to Vh.
// Production: the pump runs and the zone cools (equations 2 to 5 and 8). The
//   pump speed can change day by day (types.ts, PumpSchedule).
//
// Injection and soak only need to be plausible. They must end in the state
// that production starts from: the zone at Ts with volume Vh. The production
// numbers are exact, because the pump speed limit derives from them.
//
// Records: each phase is recorded at whole days from its own start. Soak day 0
// is at the exact end of injection, so production days are whole numbers.

import { heatedRadius, heatedZone, steamEnthalpy } from "./heat";
import { inflowRate, pumpCapacity } from "./inflow";
import { DEFAULT_PARAMS, HOURS_PER_DAY, INPUT_RANGES, M3_PER_BBL } from "./parameters";
import {
  floatingRisk,
  polishedRodLoad,
  productionDayAtSafeSpeed,
  safePumpSpeed,
} from "./rod";
import { coolingTimeConstant, productionTemperature } from "./temperature";
import type {
  CycleResult,
  DayState,
  ModelParams,
  Phase,
  PumpSchedule,
  ResolvedWellConfig,
  WellConfig,
} from "./types";
import { viscosityCp } from "./viscosity";
import { wellheadTemperature } from "./wellhead";

/** Length of injection at the field steam rate (3,100 kg/h), days. */
export function injectionDays(steamVolumeM3: number, p: ModelParams = DEFAULT_PARAMS): number {
  return (p.waterDensity * steamVolumeM3) / (p.steamRateKgH * HOURS_PER_DAY);
}

/** Heated-zone temperature during injection, °C. */
export function injectionTemperature(injectionDay: number, p: ModelParams = DEFAULT_PARAMS): number {
  return (
    p.reservoirTempC +
    (p.steamTempC - p.reservoirTempC) * (1 - Math.exp(-injectionDay / p.injectionTauDays))
  );
}

/**
 * Share of the final heated volume that exists at the end of injection:
 * sensible heat plus the latent heat of the steam condensed so far (fc).
 * 0.705 in the worked case.
 */
export function injectionHeatFraction(steamQuality: number, p: ModelParams = DEFAULT_PARAMS): number {
  const sensible = p.waterHeatCapacity * (p.steamTempC - p.reservoirTempC);
  return (sensible + p.condensedFraction * steamQuality * p.latentHeat) / steamEnthalpy(steamQuality, p);
}

function requireFinite(name: string, value: number, test: (v: number) => boolean, rule: string): void {
  if (!Number.isFinite(value) || !test(value)) {
    throw new RangeError(`${name} is ${value}. It must be ${rule}.`);
  }
}

/** Fills in defaults and rejects values the physics cannot use. Values outside
 *  the simulator ranges are allowed, so the research page can explore them. */
export function resolveConfig(config: WellConfig): ResolvedWellConfig {
  const resolved: ResolvedWellConfig = {
    ...config,
    productionDays: config.productionDays ?? INPUT_RANGES.productionDays.defaultValue,
  };
  requireFinite("Steam volume", resolved.steamVolumeM3, (v) => v > 0, "above 0");
  requireFinite("Steam quality", resolved.steamQuality, (v) => v > 0 && v <= 1, "above 0 and at most 1");
  requireFinite("Soak time", resolved.soakDays, (v) => v >= 0, "0 or more");
  requireFinite("Stroke length", resolved.strokeM, (v) => v > 0, "above 0");
  requireFinite("Production days", resolved.productionDays, (v) => Number.isInteger(v) && v >= 1, "a whole number, 1 or more");
  validateSchedule(resolved.pumpSpeedSPM);
  return resolved;
}

/** Rejects a schedule that cannot give a speed for every production day. */
export function validateSchedule(schedule: PumpSchedule): void {
  if (typeof schedule === "number") {
    requireFinite("Pump speed", schedule, (v) => v >= 0, "0 or more");
    return;
  }
  if (typeof schedule === "function") return; // checked day by day
  switch (schedule.kind) {
    case "steps": {
      const steps = schedule.steps;
      if (steps.length === 0 || steps[0].fromProductionDay !== 0) {
        throw new RangeError("Pump steps must start with a step from production day 0.");
      }
      steps.forEach((step, i) => {
        requireFinite(`Pump step ${i + 1} speed`, step.spm, (v) => v >= 0, "0 or more");
        if (i > 0 && !(step.fromProductionDay > steps[i - 1].fromProductionDay)) {
          throw new RangeError("Pump steps must be in order of production day, with no repeats.");
        }
      });
      return;
    }
    case "follow-then-hold":
      requireFinite("Hold-from day", schedule.holdFromDay, (v) => v >= 0, "0 or more");
      requireFinite("Share of the safe speed", schedule.fraction, (v) => v > 0, "above 0");
      return;
    case "follow-limit":
      requireFinite("Share of the safe speed", schedule.fraction, (v) => v > 0, "above 0");
      return;
  }
}

/** A share of the safe speed, held inside the pump range. */
function followLimit(fraction: number, safeSpeedSPM: number, p: ModelParams): number {
  return Math.min(p.mechanicalMaxSPM, Math.max(INPUT_RANGES.pumpSpeedSPM.min, fraction * safeSpeedSPM));
}

/**
 * The set pump speed on a production day. safeSpeedOnDay gives Nmax on any
 * production day; the presets need it.
 */
export function pumpSpeedOnDay(
  schedule: PumpSchedule,
  productionDay: number,
  safeSpeedOnDay: (productionDay: number) => number,
  p: ModelParams = DEFAULT_PARAMS,
): number {
  let speed: number;
  if (typeof schedule === "number") {
    speed = schedule;
  } else if (typeof schedule === "function") {
    speed = schedule(productionDay, safeSpeedOnDay(productionDay));
  } else if (schedule.kind === "steps") {
    const current = schedule.steps.findLast((step) => step.fromProductionDay <= productionDay);
    speed = (current ?? schedule.steps[0]).spm;
  } else if (schedule.kind === "follow-limit") {
    speed = followLimit(schedule.fraction, safeSpeedOnDay(productionDay), p);
  } else {
    const day = Math.min(productionDay, schedule.holdFromDay);
    speed = followLimit(schedule.fraction, safeSpeedOnDay(day), p);
  }
  requireFinite(`Pump speed on production day ${productionDay}`, speed, (v) => v >= 0, "0 or more");
  return speed;
}

/** Short text for a schedule, for tables and the CSV export. */
export function describeSchedule(schedule: PumpSchedule): string {
  if (typeof schedule === "number") return "constant";
  if (typeof schedule === "function") return "function";
  switch (schedule.kind) {
    case "steps":
      return `steps ${schedule.steps.map((s) => `${s.fromProductionDay}:${s.spm}`).join("|")}`;
    case "follow-limit":
      return `follow-limit ${schedule.fraction}`;
    case "follow-then-hold":
      return `follow-then-hold ${schedule.fraction} from ${schedule.holdFromDay}`;
  }
}

/** Runs one CSS cycle and returns the state on every recorded day. */
export function simulateCycle(config: WellConfig, p: ModelParams = DEFAULT_PARAMS): CycleResult {
  const c = resolveConfig(config);
  const zone = heatedZone(c.steamVolumeM3, c.steamQuality, p);
  const tauDays = coolingTimeConstant(zone.radiusM, p);
  const tInj = injectionDays(c.steamVolumeM3, p);
  const fInj = injectionHeatFraction(c.steamQuality, p);
  const productionStart = tInj + c.soakDays;
  const days: DayState[] = [];

  // The well is shut in during injection and soak: no flow, pump off.
  const shutIn = (
    t: number,
    phase: Phase,
    phaseDay: number,
    tempC: number,
    volumeM3: number,
    daysSinceSteaming: number,
  ): DayState => {
    const viscosity = viscosityCp(tempC, p);
    return {
      t,
      phase,
      phaseDay,
      measured: {
        wellheadTempC: null,
        pumpLoadKN: null,
        flowRateBblD: 0,
        pumpSpeedSPM: 0,
        strokeM: c.strokeM,
        daysSinceSteaming,
      },
      inferred: {
        reservoirTempC: tempC,
        viscosityCp: viscosity,
        heatedVolumeM3: volumeM3,
        heatedRadiusM: heatedRadius(volumeM3, p),
        safePumpSpeedSPM: safePumpSpeed(viscosity, c.strokeM, p),
        floatingRisk: 0,
        inflowRateBblD: 0,
      },
    };
  };

  for (let d = 0; d < tInj; d++) {
    const volumeM3 = (fInj * zone.volumeM3 * d) / tInj;
    days.push(shutIn(d, "injection", d, injectionTemperature(d, p), volumeM3, 0));
  }

  for (let d = 0; d < c.soakDays; d++) {
    const volumeM3 = zone.volumeM3 * (fInj + ((1 - fInj) * d) / c.soakDays);
    days.push(shutIn(tInj + d, "soak", d, p.steamTempC, volumeM3, d));
  }

  // Production. The heated zone keeps its size; only its temperature falls.
  let cumulativeOilBbl = 0;
  let previousRate = 0;
  let floatingStartsDay: number | null = null;
  const safeSpeedOnDay = (day: number) =>
    safePumpSpeed(viscosityCp(productionTemperature(day, tauDays, p), p), c.strokeM, p);

  for (let d = 0; d <= c.productionDays; d++) {
    const tempC = productionTemperature(d, tauDays, p);
    const viscosity = viscosityCp(tempC, p);
    const safeSpeed = safePumpSpeed(viscosity, c.strokeM, p);
    const speed = pumpSpeedOnDay(c.pumpSpeedSPM, d, safeSpeedOnDay, p);
    const inflow = inflowRate(viscosity, zone.radiusM, p);
    const rate = Math.min(inflow, pumpCapacity(c.strokeM, speed, p));
    const risk = floatingRisk(speed, safeSpeed);

    if (floatingStartsDay === null && risk > 1) floatingStartsDay = d;
    if (d > 0) cumulativeOilBbl += (previousRate + rate) / 2; // trapezoid rule, 1-day steps
    previousRate = rate;

    days.push({
      t: productionStart + d,
      phase: "production",
      phaseDay: d,
      measured: {
        wellheadTempC: wellheadTemperature(rate, tempC, p),
        pumpLoadKN: speed > 0 ? polishedRodLoad(viscosity, c.strokeM, speed, p).totalKN : null,
        flowRateBblD: rate,
        pumpSpeedSPM: speed,
        strokeM: c.strokeM,
        daysSinceSteaming: c.soakDays + d,
      },
      inferred: {
        reservoirTempC: tempC,
        viscosityCp: viscosity,
        heatedVolumeM3: zone.volumeM3,
        heatedRadiusM: zone.radiusM,
        safePumpSpeedSPM: safeSpeed,
        floatingRisk: risk,
        inflowRateBblD: inflow,
      },
    });
  }

  const steamBbl = c.steamVolumeM3 / M3_PER_BBL; // cold-water equivalent
  return {
    config: c,
    params: p,
    days,
    phases: {
      injection: { startT: 0, endT: tInj },
      soak: { startT: tInj, endT: productionStart },
      production: { startT: productionStart, endT: productionStart + c.productionDays },
    },
    summary: {
      injectionDays: tInj,
      heatedVolumeM3: zone.volumeM3,
      heatedRadiusM: zone.radiusM,
      tauDays,
      steamBbl,
      cumulativeOilBbl,
      steamOilRatio: steamBbl / cumulativeOilBbl,
      limitBindsDay: productionDayAtSafeSpeed(p.mechanicalMaxSPM, c.strokeM, tauDays, p),
      floatingStartsDay,
    },
  };
}
