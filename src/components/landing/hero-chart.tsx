// The one animation on the site. Static SVG; the line draw and the shade
// fade-in run once on load through CSS classes in globals.css. Those classes
// hold the final state under prefers-reduced-motion and below 768px.
//
// The data is the worked case from the physics module (src/lib/physics),
// computed at build time; no model number is typed here. Colours come from CSS
// variables, so the chart follows the theme (DESIGN.md §6.1). Oil viscosity is
// ink and the maximum safe pump speed is green ("main", DESIGN.md §6.2). The
// days after the safe-speed limit starts to bind are marked in gold.

import { DEFAULT_PARAMS, REFERENCE_CASE, simulateCycle } from "@/lib/physics";
import { formatNumber } from "@/lib/format";

const X0 = 54;
const X1 = 626;
const Y0 = 28;
const Y1 = 336;

const cycle = simulateCycle(REFERENCE_CASE);
const production = cycle.days.filter((d) => d.phase === "production");
const first = production[0];
const last = production[production.length - 1];
const LAST_DAY = last.phaseDay;
const BIND_DAY = Math.min(cycle.summary.limitBindsDay ?? LAST_DAY, LAST_DAY);
const DAY_TICKS = Array.from({ length: Math.floor(LAST_DAY / 30) + 1 }, (_, i) => i * 30);

const LOG_MAX = Math.log10(20000);
const PUMP_MAX = 15;

const xPos = (day: number) => X0 + (day / LAST_DAY) * (X1 - X0);
const yViscosity = (v: number) => Y1 - (Math.log10(v) / LOG_MAX) * (Y1 - Y0);
const yPump = (s: number) => Y1 - (s / PUMP_MAX) * (Y1 - Y0);

const line = (value: (day: (typeof production)[number]) => number, scale: (n: number) => number) =>
  production.map((d) => `${xPos(d.phaseDay).toFixed(1)},${scale(value(d)).toFixed(1)}`).join(" ");

const ARIA_LABEL =
  `Line chart of the worked case. After the steam cycle, oil viscosity rises from ${formatNumber(first.inferred.viscosityCp, 1)} ` +
  `to ${formatNumber(last.inferred.viscosityCp)} centipoise over ${LAST_DAY} days, on a log scale. The maximum safe pump speed ` +
  `holds at ${formatNumber(DEFAULT_PARAMS.mechanicalMaxSPM)} strokes per minute until day ${formatNumber(BIND_DAY, 1)}, then falls ` +
  `to ${formatNumber(last.inferred.safePumpSpeedSPM, 1)} by day ${LAST_DAY}. The chart shades that last stretch as the window nobody monitors.`;

const LEFT_TICKS = [
  { value: 1, label: "1" },
  { value: 10, label: "10" },
  { value: 100, label: "100" },
  { value: 1000, label: "1k" },
  { value: 10000, label: "10k" },
];

const RIGHT_TICKS = [0, 5, 10, 15];

export function HeroChart() {
  return (
    <figure className="w-full">
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-caption text-ink-muted">
        <span className="flex items-center gap-2">
          <span className="h-0.5 w-5 bg-ink" aria-hidden="true" />
          Oil viscosity — cP, log scale
        </span>
        <span className="flex items-center gap-2">
          <span className="h-0.5 w-5 bg-green" aria-hidden="true" />
          Maximum safe pump speed — SPM
        </span>
      </div>

      <div className="mt-3 flex justify-center">
        <svg
          viewBox="0 0 680 372"
          className="w-full max-md:h-[260px]"
          role="img"
          aria-label={ARIA_LABEL}
        >
          {/* horizontal grid + left axis ticks */}
          {LEFT_TICKS.map((tick) => {
            const y = yViscosity(tick.value);
            return (
              <g key={tick.value}>
                <line x1={X0} x2={X1} y1={y} y2={y} stroke="var(--hairline)" strokeWidth="1" />
                <text x={X0 - 8} y={y + 3} textAnchor="end" fontSize="10" fill="var(--ink-muted)">
                  {tick.label}
                </text>
              </g>
            );
          })}

          {/* right axis ticks (pump speed) */}
          {RIGHT_TICKS.map((value) => (
            <text
              key={value}
              x={X1 + 8}
              y={yPump(value) + 3}
              textAnchor="start"
              fontSize="10"
              fill="var(--ink-muted)"
            >
              {value}
            </text>
          ))}

          {/* x axis */}
          <line x1={X0} x2={X1} y1={Y1} y2={Y1} stroke="var(--hairline-strong)" strokeWidth="1" />
          {DAY_TICKS.map((day) => (
            <text key={day} x={xPos(day)} y={Y1 + 18} textAnchor="middle" fontSize="10" fill="var(--ink-muted)">
              {day}
            </text>
          ))}
          <text x={(X0 + X1) / 2} y={Y1 + 32} textAnchor="middle" fontSize="10" fill="var(--ink-muted)">
            Production day (days after soak ends)
          </text>

          {/* axis units */}
          <text x={X0} y={18} textAnchor="start" fontSize="10" fill="var(--ink-muted)">
            cP
          </text>
          <text x={X1} y={18} textAnchor="end" fontSize="10" fill="var(--ink-muted)">
            SPM
          </text>

          {/* shaded window — fades in after the lines draw */}
          <g className="hero-chart-extras">
            <rect
              x={xPos(BIND_DAY)}
              y={Y0}
              width={xPos(LAST_DAY) - xPos(BIND_DAY)}
              height={Y1 - Y0}
              fill="var(--gold-tint)"
            />
            <text
              x={(xPos(BIND_DAY) + xPos(LAST_DAY)) / 2}
              y={298}
              textAnchor="middle"
              fontSize="10.5"
              fontWeight="500"
              fill="var(--gold-text)"
            >
              <tspan x={(xPos(BIND_DAY) + xPos(LAST_DAY)) / 2} dy="0">
                The window
              </tspan>
              <tspan x={(xPos(BIND_DAY) + xPos(LAST_DAY)) / 2} dy="13">
                nobody monitors.
              </tspan>
            </text>
          </g>

          {/* data lines */}
          <polyline
            className="hero-chart-line"
            points={line((d) => d.inferred.viscosityCp, yViscosity)}
            fill="none"
            stroke="var(--ink)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
          />
          <polyline
            className="hero-chart-line"
            points={line((d) => d.inferred.safePumpSpeedSPM, yPump)}
            fill="none"
            stroke="var(--green)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
          />

          {/* endpoint markers */}
          <g className="hero-chart-extras">
            <circle cx={xPos(LAST_DAY)} cy={yViscosity(last.inferred.viscosityCp)} r="3" fill="var(--ink)" />
            <circle cx={xPos(LAST_DAY)} cy={yPump(last.inferred.safePumpSpeedSPM)} r="3" fill="var(--green)" />
          </g>
        </svg>
      </div>

      <figcaption className="mt-3 text-caption text-ink-muted">
        The worked case from the physics model: {formatNumber(REFERENCE_CASE.steamVolumeM3)} m³ of steam, a{" "}
        {formatNumber(REFERENCE_CASE.strokeM, 1)} m stroke. Viscosity is anchored on {formatNumber(DEFAULT_PARAMS.anchorViscosityCp)} cP at{" "}
        {formatNumber(DEFAULT_PARAMS.anchorTempC)} °C.
      </figcaption>
    </figure>
  );
}
