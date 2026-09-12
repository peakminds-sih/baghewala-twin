"use client";

import { useMemo } from "react";
import { ChartSync } from "@/components/charts/chart-sync";
import { LineChart, type ChartBand, type ChartPoint } from "@/components/charts/line-chart";
import { DEFAULT_PARAMS, VARIABLES, type CycleResult, type DayState } from "@/lib/physics";
import { formatDay } from "./values";

// The live charts. Each names the equation that drew it. All share one x
// axis (days from the start of injection), the phase bands and the gold
// current-day marker.

const X_AXIS = { label: "Days from the start of injection" };

function series(days: readonly DayState[], read: (day: DayState) => number | null): ChartPoint[] {
  return days.map((day) => ({ x: day.t, y: read(day) }));
}

const inProduction = (day: DayState, value: number | null) => (day.phase === "production" ? value : null);

/** One band for each run of production days with floating risk above 1. */
function riskBands(days: readonly DayState[]): ChartBand[] {
  const bands: ChartBand[] = [];
  let start: DayState | null = null;
  let last: DayState | null = null;
  for (const day of days) {
    const floating = day.phase === "production" && day.inferred.floatingRisk > 1;
    if (floating) {
      start ??= day;
      last = day;
    } else if (start && last) {
      bands.push({ from: start.t - 0.5, to: last.t + 0.5, tone: "risk", label: "Floating risk" });
      start = null;
    }
  }
  if (start && last) bands.push({ from: start.t - 0.5, to: last.t, tone: "risk", label: "Floating risk" });
  return bands;
}

export function SimulatorCharts({
  result,
  markerX,
  markerAnimate,
  onPickX,
}: {
  result: CycleResult;
  markerX: number;
  markerAnimate: boolean;
  onPickX: (x: number) => void;
}) {
  const charts = useMemo(() => {
    const { days, phases } = result;
    const phaseBands: ChartBand[] = [
      { from: phases.injection.startT, to: phases.injection.endT, tone: "gold", label: "Injection" },
      { from: phases.soak.startT, to: phases.soak.endT, tone: "green", label: "Soak" },
    ];
    return {
      phaseBands,
      riskBands: riskBands(days),
      temperature: series(days, (d) => d.inferred.reservoirTempC),
      viscosity: series(days, (d) => d.inferred.viscosityCp),
      safeSpeed: series(days, (d) => inProduction(d, d.inferred.safePumpSpeedSPM)),
      setSpeed: series(days, (d) => inProduction(d, d.measured.pumpSpeedSPM)),
      rate: series(days, (d) => inProduction(d, d.measured.flowRateBblD)),
      inflow: series(days, (d) => inProduction(d, d.inferred.inflowRateBblD)),
      wellhead: series(days, (d) => d.measured.wellheadTempC),
      load: series(days, (d) => d.measured.pumpLoadKN),
    };
  }, [result]);

  const marker = { x: markerX, animate: markerAnimate };
  const common = { x: X_AXIS, marker, formatX: formatDay, onPickX, height: 220 };
  const ceiling = DEFAULT_PARAMS.mechanicalMaxSPM;
  const v = VARIABLES;

  return (
    <ChartSync>
      <div className="space-y-10">
        <div className="grid gap-x-8 gap-y-10 lg:grid-cols-2">
          <LineChart
            {...common}
            title="Steam heats the zone; production lets it cool"
            subtitle="Eq 7 during injection and soak, Eq 2 during production"
            series={[{ id: "t", label: v.reservoirTempC.name, role: "main", unit: v.reservoirTempC.unit, points: charts.temperature }]}
            y={{ label: `${v.reservoirTempC.name} (${v.reservoirTempC.unit})`, min: 0, max: 300 }}
            bands={charts.phaseBands}
          />
          <LineChart
            {...common}
            title="The oil thickens steeply as the zone cools"
            subtitle="Eq 3, ASTM D341 (Walther)"
            series={[{ id: "mu", label: v.viscosityCp.name, role: "main", unit: v.viscosityCp.unit, points: charts.viscosity }]}
            y={{ label: `${v.viscosityCp.name} (${v.viscosityCp.unit}, log scale)`, scale: "log" }}
            bands={charts.phaseBands}
          />
          <LineChart
            {...common}
            title="The safe pump speed falls as the oil thickens"
            subtitle="Eq 5. Where the set speed is above the safe speed, the rods float."
            series={[
              { id: "nmax", label: "Safe speed", role: "main", unit: "SPM", digits: 2, points: charts.safeSpeed },
              { id: "n", label: "Set speed", role: "limit", unit: "SPM", digits: 2, step: true, points: charts.setSpeed },
            ]}
            y={{ label: "Pump speed (SPM)", min: 0, max: ceiling + 2 }}
            bands={[...charts.phaseBands, ...charts.riskBands]}
            rules={[{ y: ceiling, label: `Mechanical ceiling ${ceiling} SPM` }]}
          />
          <LineChart
            {...common}
            title="The oil rate falls back towards the cold rate"
            subtitle="Eq 4. The surface rate is the smaller of reservoir inflow and pump capacity."
            series={[
              { id: "q", label: "Surface rate", role: "measured", unit: "bbl/d", points: charts.rate },
              { id: "qin", label: "Reservoir inflow", role: "comparison", unit: "bbl/d", points: charts.inflow },
            ]}
            y={{ label: "Oil rate (bbl/d)", min: 0 }}
            bands={charts.phaseBands}
          />
        </div>

        <div>
          <h3 className="font-serif text-h4 font-medium text-green">What a sensor would read</h3>
          <p className="mt-1 max-w-[68ch] text-ui text-ink-muted">
            These are measured values. A later stage uses them to infer the hidden state above. The well is shut in
            during injection and soak, so there is no reading then.
          </p>
          <div className="mt-6 grid gap-x-8 gap-y-10 lg:grid-cols-2">
            <LineChart
              {...common}
              title="The oil cools on its way up, more so at a low rate"
              subtitle="Eq 8, Ramey (1962)"
              series={[{ id: "twh", label: v.wellheadTempC.name, role: "measured", unit: v.wellheadTempC.unit, points: charts.wellhead }]}
              y={{ label: `${v.wellheadTempC.name} (${v.wellheadTempC.unit})` }}
              bands={charts.phaseBands}
            />
            <LineChart
              {...common}
              title="Thick oil drags on the rods and raises the load"
              subtitle="Eq 8, peak polished-rod load"
              series={[{ id: "pprl", label: v.pumpLoadKN.name, role: "measured", unit: v.pumpLoadKN.unit, points: charts.load }]}
              y={{ label: `${v.pumpLoadKN.name} (${v.pumpLoadKN.unit})`, min: 0 }}
              bands={charts.phaseBands}
            />
          </div>
        </div>
      </div>
    </ChartSync>
  );
}
