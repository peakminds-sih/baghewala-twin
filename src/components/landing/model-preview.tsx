"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Section, SectionHeading } from "@/components/site/section";
import { SliderField } from "@/components/kit/slider-field";
import { Readout } from "@/components/kit/readout";
import { LineChart } from "@/components/charts/line-chart";
import { DEFAULT_PARAMS, INPUT_RANGES, REFERENCE_CASE, simulateCycle } from "@/lib/physics";

// A small, live preview of the physics module (DESIGN.md: charts read colour
// from CSS variables via the LineChart component). It shares the reference
// case with the simulator, so the numbers here always match.

export function ModelPreview() {
  const [steamVolumeM3, setSteamVolumeM3] = useState(INPUT_RANGES.steamVolumeM3.defaultValue);
  const [productionDays, setProductionDays] = useState(INPUT_RANGES.productionDays.defaultValue);

  const result = useMemo(
    () => simulateCycle({ ...REFERENCE_CASE, steamVolumeM3, productionDays }),
    [steamVolumeM3, productionDays],
  );

  const production = result.days.filter((day) => day.phase === "production");

  return (
    <Section surface="soft">
      <SectionHeading
        title="See the chain move"
        lead="Two decisions feed one model. Change the steam volume or the production length and watch the safe pump speed, the steam–oil ratio, and the day the limit binds respond."
      />

      <div className="mt-12 grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div>
          <div className="space-y-6">
            <SliderField
              id="preview-steam-volume"
              label={INPUT_RANGES.steamVolumeM3.name}
              symbol={INPUT_RANGES.steamVolumeM3.symbol}
              unit={INPUT_RANGES.steamVolumeM3.unit}
              value={steamVolumeM3}
              min={INPUT_RANGES.steamVolumeM3.min}
              max={INPUT_RANGES.steamVolumeM3.max}
              step={INPUT_RANGES.steamVolumeM3.step}
              onChange={setSteamVolumeM3}
              tier={INPUT_RANGES.steamVolumeM3.tier}
              fieldRange={INPUT_RANGES.steamVolumeM3.fieldRange}
            />
            <SliderField
              id="preview-production-days"
              label={INPUT_RANGES.productionDays.name}
              symbol={INPUT_RANGES.productionDays.symbol}
              unit={INPUT_RANGES.productionDays.unit}
              value={productionDays}
              min={INPUT_RANGES.productionDays.min}
              max={INPUT_RANGES.productionDays.max}
              step={INPUT_RANGES.productionDays.step}
              onChange={setProductionDays}
              tier={INPUT_RANGES.productionDays.tier}
              fieldRange={INPUT_RANGES.productionDays.fieldRange}
            />
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4">
            <Readout
              label="Steam–oil ratio"
              value={result.summary.steamOilRatio}
              digits={1}
              kind="inferred"
            />
            <Readout
              label="Day the limit binds"
              value={result.summary.limitBindsDay}
              unit="day"
              digits={1}
              kind="inferred"
            />
          </div>

          <Link
            href="/simulator"
            className="mt-6 inline-flex items-center gap-2 rounded-sm text-ui font-medium text-green"
          >
            Open the simulator
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="min-w-0 rounded-md border border-hairline bg-cream p-5">
          <LineChart
            title="Safe pump speed falls as the zone cools"
            subtitle="Production phase only. The set speed holds steady while the safe limit drops."
            x={{ label: "Production day" }}
            y={{ label: "Pump speed (SPM)" }}
            series={[
              {
                id: "safe",
                label: "Safe pump speed",
                role: "main",
                unit: "SPM",
                digits: 1,
                points: production.map((day) => ({ x: day.phaseDay, y: day.inferred.safePumpSpeedSPM })),
              },
              {
                id: "set",
                label: "Set pump speed",
                role: "limit",
                unit: "SPM",
                digits: 1,
                points: production.map((day) => ({ x: day.phaseDay, y: day.measured.pumpSpeedSPM })),
              },
            ]}
            rules={[
              {
                y: DEFAULT_PARAMS.mechanicalMaxSPM,
                label: `Mechanical ceiling, ${DEFAULT_PARAMS.mechanicalMaxSPM} SPM`,
              },
            ]}
            formatX={(value) => `Day ${Math.round(value)}`}
          />
        </div>
      </div>
    </Section>
  );
}
