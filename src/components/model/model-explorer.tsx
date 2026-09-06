"use client";

import { useMemo, useState } from "react";
import {
  DEFAULT_INPUTS,
  MECHANICAL_PUMP_LIMIT,
  PARAMS,
  simulate,
  type ModelInputs,
} from "@/lib/model/twin";
import { ParameterSlider } from "./parameter-slider";
import { ModelReadout } from "./model-readout";
import { ModelChart, type ChartAxis } from "./model-chart";

function niceCeil(value: number): number {
  if (value <= 0) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const scaled = value / magnitude;
  const step = scaled <= 1 ? 1 : scaled <= 2 ? 2 : scaled <= 5 ? 5 : 10;
  return step * magnitude;
}

function evenTicks(max: number, count = 4): number[] {
  return Array.from({ length: count + 1 }, (_, i) => Math.round((max * i) / count));
}

function powerTicks(max: number): number[] {
  const ticks: number[] = [];
  for (let p = 1; p <= max + 1; p *= 10) ticks.push(p);
  return ticks;
}

const viscosityLabel = (value: number) =>
  value >= 1000 ? `${value / 1000}k` : String(value);

export function ModelExplorer() {
  const [inputs, setInputs] = useState<ModelInputs>(DEFAULT_INPUTS);
  const result = useMemo(() => simulate(inputs), [inputs]);

  const isDefault = PARAMS.every(
    (p) => inputs[p.key] === DEFAULT_INPUTS[p.key],
  );

  const charts = useMemo(() => {
    const days = result.series.map((p) => p.day);
    const tempMax = Math.ceil(inputs.steamTemp / 50) * 50;
    const oilMax = niceCeil(result.peakOilRate);
    const viscosityMax = Math.min(
      100000,
      Math.max(
        10000,
        Math.pow(
          10,
          Math.ceil(Math.log10(Math.max(...result.series.map((p) => p.viscosityCp), 10))),
        ),
      ),
    );

    const tempAxis: ChartAxis = {
      unit: "°C",
      min: 0,
      max: tempMax,
      ticks: Array.from({ length: tempMax / 50 + 1 }, (_, i) => i * 50),
    };
    const oilAxis: ChartAxis = {
      unit: "bbl/d",
      min: 0,
      max: oilMax,
      ticks: evenTicks(oilMax),
    };
    const viscosityAxis: ChartAxis = {
      unit: "cP",
      scale: "log",
      min: 1,
      max: viscosityMax,
      ticks: powerTicks(viscosityMax),
      format: viscosityLabel,
    };
    const speedAxis: ChartAxis = {
      unit: "SPM",
      min: 0,
      max: 15,
      ticks: [0, 5, 10, 15],
    };

    return {
      days,
      thermal: {
        left: tempAxis,
        right: oilAxis,
        lines: [
          {
            label: "Rock temperature",
            color: "#aa2d00",
            axis: "left" as const,
            values: result.series.map((p) => p.tempC),
          },
          {
            label: "Oil rate (estimate)",
            color: "#0a2e0e",
            axis: "right" as const,
            values: result.series.map((p) => p.oilRateBpd),
          },
        ],
      },
      mechanical: {
        left: viscosityAxis,
        right: speedAxis,
        lines: [
          {
            label: "Oil viscosity",
            color: "#181d26",
            axis: "left" as const,
            values: result.series.map((p) => p.viscosityCp),
          },
          {
            label: "Max safe pump speed",
            color: "#1b61c9",
            axis: "right" as const,
            values: result.series.map((p) => p.maxPumpSpeed),
          },
        ],
      },
    };
  }, [result, inputs.steamTemp]);

  const setValue = (key: keyof ModelInputs, value: number) =>
    setInputs((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="grid gap-10 lg:grid-cols-[300px_minmax(0,1fr)]">
      <div>
        <div className="space-y-6">
          {PARAMS.map((meta) => (
            <ParameterSlider
              key={meta.key}
              meta={meta}
              value={inputs[meta.key]}
              onChange={(value) => setValue(meta.key, value)}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => setInputs(DEFAULT_INPUTS)}
          disabled={isDefault}
          className="mt-6 rounded-sm text-[13px] font-medium text-link outline-none focus-visible:ring-2 focus-visible:ring-link focus-visible:ring-offset-2 disabled:text-muted-ink disabled:opacity-60"
        >
          Reset to the worked example
        </button>
      </div>

      <div className="min-w-0 space-y-8">
        <ModelReadout result={result} />

        <div className="rounded-md border border-hairline bg-canvas p-5">
          <h3 className="text-[14px] font-medium text-ink">
            Temperature and oil rate
          </h3>
          <p className="mt-1 text-[12px] text-muted-ink">
            The heated rock cools, so the oil rate falls with it.
          </p>
          <div className="mt-4">
            <ModelChart
              days={charts.days}
              xLabel="Days into the production cycle"
              left={charts.thermal.left}
              right={charts.thermal.right}
              lines={charts.thermal.lines}
              ariaLabel="Line chart of rock temperature and estimated oil rate against days into the production cycle. Both fall as the well cools."
            />
          </div>
        </div>

        <div className="rounded-md border border-hairline bg-canvas p-5">
          <h3 className="text-[14px] font-medium text-ink">
            Viscosity and the safe pump speed
          </h3>
          <p className="mt-1 text-[12px] text-muted-ink">
            As the oil thickens, the rod-float limit drops. The shaded band is
            where it falls below the {MECHANICAL_PUMP_LIMIT} SPM pump ceiling.
          </p>
          <div className="mt-4">
            <ModelChart
              days={charts.days}
              xLabel="Days into the production cycle"
              left={charts.mechanical.left}
              right={charts.mechanical.right}
              lines={charts.mechanical.lines}
              shadeFromDay={result.floatBindsDay}
              shadeLabel="rod-float limit"
              ariaLabel="Line chart of oil viscosity on a logarithmic scale and the maximum safe pump speed against days into the production cycle. Viscosity climbs as the well cools and the safe pump speed collapses late in the cycle."
            />
          </div>
        </div>

        <p className="text-[12px] leading-relaxed text-muted-ink">
          Temperature, viscosity and the safe pump speed come from the
          reduced-order equations in the technical reference (sections 4–5),
          anchored on the measured 11,500 cP at 50 °C. Oil rate and the
          steam–oil ratio are an estimate: they use a relative-mobility inflow
          model calibrated so the worked example sits mid-range in the reported
          SOR band.
        </p>
      </div>
    </div>
  );
}
