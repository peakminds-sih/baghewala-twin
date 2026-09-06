"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Section, SectionHeading } from "@/components/site/section";
import { ParameterSlider } from "@/components/model/parameter-slider";
import { ModelChart, type ChartAxis } from "@/components/model/model-chart";
import {
  DEFAULT_INPUTS,
  PARAMS,
  simulate,
  type ModelInputs,
} from "@/lib/model/twin";

const PREVIEW_KEYS = ["steamVolume", "cycleLength"] as const;

const viscosityLabel = (value: number) =>
  value >= 1000 ? `${value / 1000}k` : String(value);

const VISCOSITY_AXIS: ChartAxis = {
  unit: "cP",
  scale: "log",
  min: 1,
  max: 10000,
  ticks: [1, 10, 100, 1000, 10000],
  format: viscosityLabel,
};

const SPEED_AXIS: ChartAxis = {
  unit: "SPM",
  min: 0,
  max: 15,
  ticks: [0, 5, 10, 15],
};

export function ModelPreview() {
  const [inputs, setInputs] = useState<ModelInputs>(DEFAULT_INPUTS);
  const result = useMemo(() => simulate(inputs), [inputs]);

  const days = result.series.map((p) => p.day);
  const lines = [
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
  ];

  return (
    <Section surface="soft">
      <SectionHeading
        title="See the chain move"
        lead="Two decisions feed one model. Change the steam volume or the cycle length and watch the viscosity, the safe pump speed, and the steam–oil ratio respond."
      />

      <div className="mt-12 grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div>
          <div className="space-y-6">
            {PARAMS.filter((p) =>
              PREVIEW_KEYS.includes(p.key as (typeof PREVIEW_KEYS)[number]),
            ).map((meta) => (
              <ParameterSlider
                key={meta.key}
                meta={meta}
                value={inputs[meta.key]}
                onChange={(value) =>
                  setInputs((prev) => ({ ...prev, [meta.key]: value }))
                }
              />
            ))}
          </div>

          <dl className="mt-8 grid grid-cols-2 gap-4">
            <div>
              <dt className="text-[12px] text-muted-ink">Steam–oil ratio</dt>
              <dd className="mt-1 text-[20px] font-medium text-ink tabular-nums">
                {Number.isFinite(result.sor) ? result.sor.toFixed(1) : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[12px] text-muted-ink">Cooling constant τ</dt>
              <dd className="mt-1 text-[20px] font-medium text-ink tabular-nums">
                {result.coolingConstant.toFixed(0)} d
              </dd>
            </div>
          </dl>

          <Link
            href="/model"
            className="mt-6 inline-flex items-center gap-2 rounded-sm text-[14px] font-medium text-link outline-none focus-visible:ring-2 focus-visible:ring-link focus-visible:ring-offset-2"
          >
            Open the full model
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="min-w-0 rounded-md border border-hairline bg-canvas p-5">
          <ModelChart
            days={days}
            xLabel="Days into the production cycle"
            left={VISCOSITY_AXIS}
            right={SPEED_AXIS}
            lines={lines}
            shadeFromDay={result.floatBindsDay}
            shadeLabel="rod-float limit"
            ariaLabel="Line chart of oil viscosity on a logarithmic scale and the maximum safe pump speed against days into the production cycle."
          />
        </div>
      </div>
    </Section>
  );
}
