// The range each computed variable takes across the simulator inputs. The
// cycles run in the Web Worker; this file only builds the jobs and reads the
// results. Pure TypeScript: no React.

import {
  INPUT_RANGES,
  REFERENCE_CASE,
  pumpCapacity,
  steamEnthalpy,
  type SweepPoint,
  type VariableKey,
} from "@/lib/physics";
import type { SweepJob } from "./relationships";

export interface ValueRange {
  min: number;
  max: number;
}

/**
 * Every corner of the simulator inputs: quality, stroke and a constant pump
 * speed at their limits, each swept over the lowest, default and highest
 * steam volume, with the longest soak. The model is monotonic in each input,
 * so the corners hold the extremes.
 */
export function rangeJobs(): SweepJob[] {
  const { steamQuality: q, strokeM: s, pumpSpeedSPM: n, steamVolumeM3: v, soakDays: soak } = INPUT_RANGES;
  const jobs: SweepJob[] = [];
  for (const steamQuality of [q.min, q.max]) {
    for (const strokeM of [s.min, s.max]) {
      for (const pumpSpeedSPM of [n.min, n.max]) {
        jobs.push({
          base: { ...REFERENCE_CASE, steamQuality, strokeM, pumpSpeedSPM, soakDays: soak.max },
          target: { kind: "input", key: "steamVolumeM3" },
          values: [v.min, v.defaultValue, v.max],
        });
      }
    }
  }
  return jobs;
}

/** Folds the corner cycles into a min–max range per variable. */
export function summarizeRanges(results: SweepPoint[][]): Partial<Record<VariableKey, ValueRange>> {
  const ranges = new Map<VariableKey, ValueRange>();
  const add = (key: VariableKey, value: number | null) => {
    if (value === null || !Number.isFinite(value)) return;
    const range = ranges.get(key);
    if (!range) ranges.set(key, { min: value, max: value });
    else {
      range.min = Math.min(range.min, value);
      range.max = Math.max(range.max, value);
    }
  };

  for (const points of results) {
    for (const { result } of points) {
      const s = result.summary;
      add("heatedVolumeM3", s.heatedVolumeM3);
      add("heatedRadiusM", s.heatedRadiusM);
      add("tauDays", s.tauDays);
      add("injectionDays", s.injectionDays);
      add("cumulativeOilBbl", s.cumulativeOilBbl);
      add("steamOilRatio", s.steamOilRatio);
      for (const day of result.days) {
        add("reservoirTempC", day.inferred.reservoirTempC);
        add("viscosityCp", day.inferred.viscosityCp);
        add("daysSinceSteaming", day.measured.daysSinceSteaming);
        if (day.phase !== "production") continue;
        add("flowRateBblD", day.measured.flowRateBblD);
        add("inflowRateBblD", day.inferred.inflowRateBblD);
        add("safePumpSpeedSPM", day.inferred.safePumpSpeedSPM);
        add("floatingRisk", day.inferred.floatingRisk);
        add("wellheadTempC", day.measured.wellheadTempC);
        add("pumpLoadKN", day.measured.pumpLoadKN);
      }
    }
  }

  // Two values need no cycle at all.
  const { steamQuality: q, strokeM: s, pumpSpeedSPM: n } = INPUT_RANGES;
  add("steamEnthalpy", steamEnthalpy(q.min));
  add("steamEnthalpy", steamEnthalpy(q.max));
  add("pumpCapacityBblD", pumpCapacity(s.min, n.min));
  add("pumpCapacityBblD", pumpCapacity(s.max, n.max));

  return Object.fromEntries(ranges) as Partial<Record<VariableKey, ValueRange>>;
}
