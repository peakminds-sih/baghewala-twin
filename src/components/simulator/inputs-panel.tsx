"use client";

import { DEFAULT_PARAMS, INPUT_RANGES, PARAM_INFO, PRESET_RANGES, type InputKey } from "@/lib/physics";
import { Button } from "@/components/kit/button";
import { Panel } from "@/components/kit/panel";
import { Segmented } from "@/components/kit/segmented";
import { SliderField } from "@/components/kit/slider-field";
import { DEFAULT_INPUTS, type ScheduleMode, type SimulatorInputs } from "./state";

const MODE_OPTIONS = [
  { value: "constant", label: "Constant" },
  { value: "follow", label: "Follow the limit" },
  { value: "hold", label: "Follow, then hold" },
] as const;

const MODE_HINT: Record<ScheduleMode, string> = {
  constant: "The pump runs at one speed for the whole production phase.",
  follow: "Each day the pump runs at this share of the safe speed. This is the recommendation, followed.",
  hold:
    "The pump follows the limit until the hold day, then keeps that speed while the limit keeps falling. This is the recommendation, ignored. It floats the rods.",
};

type NumericInput = Exclude<InputKey, "pumpSpeedSPM"> & keyof SimulatorInputs;

export function InputsPanel({
  inputs,
  onChange,
}: {
  inputs: SimulatorInputs;
  onChange: (next: SimulatorInputs) => void;
}) {
  const set =
    <K extends keyof SimulatorInputs>(key: K) =>
    (value: SimulatorInputs[K]) =>
      onChange({ ...inputs, [key]: value });

  const field = (key: NumericInput) => {
    const range = INPUT_RANGES[key];
    return (
      <SliderField
        key={key}
        id={`sim-${key}`}
        label={range.name}
        symbol={range.symbol}
        unit={range.unit}
        value={inputs[key]}
        min={range.min}
        max={range.max}
        step={range.step}
        tier={range.tier}
        fieldRange={range.fieldRange}
        onChange={set(key)}
      />
    );
  };

  const speed = INPUT_RANGES.pumpSpeedSPM;
  const fraction = PRESET_RANGES.fraction;
  const hold = PRESET_RANGES.holdFromDay;

  return (
    <Panel
      title="Operator inputs"
      actions={
        <Button variant="quiet" onClick={() => onChange(DEFAULT_INPUTS)}>
          Reset to defaults
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="space-y-6">
          <p className="text-overline font-semibold uppercase text-ink-muted">Steam</p>
          {field("steamVolumeM3")}
          {field("steamQuality")}
          {field("soakDays")}
          <p className="text-caption text-ink-muted">
            Steam temperature is fixed at {DEFAULT_PARAMS.steamTempC} °C, the effective downhole value (tier{" "}
            {PARAM_INFO.steamTempC.tier}). {PARAM_INFO.steamTempC.note}
          </p>
        </div>

        <div className="space-y-6 border-t border-hairline pt-6">
          <p className="text-overline font-semibold uppercase text-ink-muted">Pump</p>
          {field("strokeM")}
          <div>
            <p id="sim-schedule-label" className="mb-2 text-ui font-medium text-ink">
              Pump speed
            </p>
            <Segmented
              label="How the pump speed is set"
              options={MODE_OPTIONS}
              value={inputs.scheduleMode}
              onChange={set("scheduleMode")}
              className="flex w-full flex-col"
            />
            <p className="mt-2 text-caption text-ink-muted">{MODE_HINT[inputs.scheduleMode]}</p>
          </div>

          {inputs.scheduleMode === "constant" ? (
            <SliderField
              id="sim-pumpSpeedSPM"
              label={speed.name}
              symbol={speed.symbol}
              unit={speed.unit}
              value={inputs.pumpSpeedSPM}
              min={speed.min}
              max={speed.max}
              step={speed.step}
              tier={speed.tier}
              onChange={set("pumpSpeedSPM")}
            />
          ) : (
            <SliderField
              id="sim-fraction"
              label={fraction.name}
              symbol={fraction.symbol}
              unit={fraction.unit}
              value={inputs.fraction}
              min={fraction.min}
              max={fraction.max}
              step={fraction.step}
              tier={fraction.tier}
              onChange={set("fraction")}
            />
          )}
          {inputs.scheduleMode === "hold" ? (
            <SliderField
              id="sim-holdFromDay"
              label={hold.name}
              symbol={hold.symbol}
              unit={hold.unit}
              value={Math.min(inputs.holdFromDay, inputs.productionDays)}
              min={hold.min}
              max={inputs.productionDays}
              step={hold.step}
              tier={hold.tier}
              onChange={set("holdFromDay")}
            />
          ) : null}
        </div>

        <div className="space-y-6 border-t border-hairline pt-6">
          <p className="text-overline font-semibold uppercase text-ink-muted">Cycle</p>
          {field("productionDays")}
        </div>
      </div>
    </Panel>
  );
}
