// The one animation on the site. Static SVG; the line draw and the shade
// fade-in run once on load through CSS classes in globals.css. Those classes
// hold the final state under prefers-reduced-motion and below 768px.

const X0 = 54;
const X1 = 626;
const Y0 = 28;
const Y1 = 336;

const DAYS = [0, 30, 60, 90, 120];
const VISCOSITY = [5, 93, 1148, 4465, 11500]; // cP
const PUMP_SPEED = [12, 12, 12, 11.5, 4.5]; // SPM

const LOG_MAX = Math.log10(20000);
const PUMP_MAX = 15;

const xPos = (day: number) => X0 + (day / 120) * (X1 - X0);
const yViscosity = (v: number) => Y1 - (Math.log10(v) / LOG_MAX) * (Y1 - Y0);
const yPump = (s: number) => Y1 - (s / PUMP_MAX) * (Y1 - Y0);

const line = (values: number[], scale: (n: number) => number) =>
  DAYS.map((day, i) => `${xPos(day).toFixed(1)},${scale(values[i]).toFixed(1)}`).join(" ");

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
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-[12px] text-muted-ink">
        <span className="flex items-center gap-2">
          <span className="h-0.5 w-5 bg-ink" aria-hidden="true" />
          Oil viscosity — cP, log scale
        </span>
        <span className="flex items-center gap-2">
          <span className="h-0.5 w-5 bg-signature-coral" aria-hidden="true" />
          Maximum safe pump speed — SPM
        </span>
      </div>

      <div className="mt-3 flex justify-center">
        <svg
          viewBox="0 0 680 372"
          className="w-full max-md:h-[260px] max-md:w-auto"
          role="img"
          aria-label="Line chart. As days pass after a steam cycle, oil viscosity rises from 5 to 11,500 centipoise on a log scale. The maximum safe pump speed holds near 12 strokes per minute until day 90, then falls to 4.5 by day 120. The chart shades days 90 to 120 as the window nobody monitors."
        >
          {/* horizontal grid + left axis ticks */}
          {LEFT_TICKS.map((tick) => {
            const y = yViscosity(tick.value);
            return (
              <g key={tick.value}>
                <line
                  x1={X0}
                  x2={X1}
                  y1={y}
                  y2={y}
                  stroke="#dddddd"
                  strokeWidth="1"
                />
                <text
                  x={X0 - 8}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="10"
                  fill="#41454d"
                >
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
              fill="#41454d"
            >
              {value}
            </text>
          ))}

          {/* x axis */}
          <line x1={X0} x2={X1} y1={Y1} y2={Y1} stroke="#9297a0" strokeWidth="1" />
          {DAYS.map((day) => (
            <text
              key={day}
              x={xPos(day)}
              y={Y1 + 18}
              textAnchor="middle"
              fontSize="10"
              fill="#41454d"
            >
              {day}
            </text>
          ))}
          <text x={(X0 + X1) / 2} y={Y1 + 38} textAnchor="middle" fontSize="10" fill="#41454d">
            Days after the steam cycle ends
          </text>

          {/* axis units */}
          <text x={X0} y={18} textAnchor="start" fontSize="10" fill="#41454d">
            cP
          </text>
          <text x={X1} y={18} textAnchor="end" fontSize="10" fill="#41454d">
            SPM
          </text>

          {/* shaded window — fades in after the lines draw */}
          <g className="hero-chart-extras">
            <rect
              x={xPos(90)}
              y={Y0}
              width={xPos(120) - xPos(90)}
              height={Y1 - Y0}
              fill="#aa2d00"
              fillOpacity="0.1"
            />
            <text
              x={(xPos(90) + xPos(120)) / 2}
              y={298}
              textAnchor="middle"
              fontSize="10.5"
              fontWeight="500"
              fill="#aa2d00"
            >
              <tspan x={(xPos(90) + xPos(120)) / 2} dy="0">
                The window
              </tspan>
              <tspan x={(xPos(90) + xPos(120)) / 2} dy="13">
                nobody monitors.
              </tspan>
            </text>
          </g>

          {/* data lines */}
          <polyline
            className="hero-chart-line"
            points={line(VISCOSITY, yViscosity)}
            fill="none"
            stroke="#181d26"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
          />
          <polyline
            className="hero-chart-line"
            points={line(PUMP_SPEED, yPump)}
            fill="none"
            stroke="#aa2d00"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
          />

          {/* endpoint markers */}
          <g className="hero-chart-extras">
            <circle cx={xPos(120)} cy={yViscosity(11500)} r="3" fill="#181d26" />
            <circle cx={xPos(120)} cy={yPump(4.5)} r="3" fill="#aa2d00" />
          </g>
        </svg>
      </div>

      <figcaption className="mt-3 text-[12px] text-muted-ink">
        Values from our reduced-order thermal model. Anchored on the measured
        viscosity of 11,500 cP at 50 °C.
      </figcaption>
    </figure>
  );
}
