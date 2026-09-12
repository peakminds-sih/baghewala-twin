// The simulator's inputs and how they become a well configuration. Ranges
// and defaults come from the physics module; nothing is retyped here.

import {
  INPUT_RANGES,
  PRESET_RANGES,
  type SerializablePumpSchedule,
  type WellConfig,
} from "@/lib/physics";

/** How the pump speed is set over the production phase. */
export type ScheduleMode = "constant" | "follow" | "hold";

export interface SimulatorInputs {
  steamVolumeM3: number;
  steamQuality: number;
  soakDays: number;
  strokeM: number;
  productionDays: number;
  scheduleMode: ScheduleMode;
  pumpSpeedSPM: number; // used by the constant mode
  fraction: number; // share of the safe speed, used by both presets
  holdFromDay: number; // used by the hold preset
}

// The defaults reproduce the worked case in the technical reference.
export const DEFAULT_INPUTS: SimulatorInputs = {
  steamVolumeM3: INPUT_RANGES.steamVolumeM3.defaultValue,
  steamQuality: INPUT_RANGES.steamQuality.defaultValue,
  soakDays: INPUT_RANGES.soakDays.defaultValue,
  strokeM: INPUT_RANGES.strokeM.defaultValue,
  productionDays: INPUT_RANGES.productionDays.defaultValue,
  scheduleMode: "constant",
  pumpSpeedSPM: INPUT_RANGES.pumpSpeedSPM.defaultValue,
  fraction: PRESET_RANGES.fraction.defaultValue,
  holdFromDay: PRESET_RANGES.holdFromDay.defaultValue,
};

export function scheduleOf(inputs: SimulatorInputs): SerializablePumpSchedule {
  switch (inputs.scheduleMode) {
    case "constant":
      return inputs.pumpSpeedSPM;
    case "follow":
      return { kind: "follow-limit", fraction: inputs.fraction };
    case "hold":
      return {
        kind: "follow-then-hold",
        fraction: inputs.fraction,
        holdFromDay: Math.min(inputs.holdFromDay, inputs.productionDays),
      };
  }
}

export function toWellConfig(inputs: SimulatorInputs): WellConfig {
  return {
    steamVolumeM3: inputs.steamVolumeM3,
    steamQuality: inputs.steamQuality,
    soakDays: inputs.soakDays,
    strokeM: inputs.strokeM,
    productionDays: inputs.productionDays,
    pumpSpeedSPM: scheduleOf(inputs),
  };
}
