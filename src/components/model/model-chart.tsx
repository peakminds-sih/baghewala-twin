// A static two-axis line chart, drawn in the same visual language as the hero
// chart: hand-rolled SVG, hairline grid, ticks on both edges. Pure and
// presentational — the parent computes every scale, tick and value array, so
// this file has no model knowledge and re-renders cheaply on each slider move.

const X0 = 56;
const X1 = 624;
const Y0 = 24;
const Y1 = 320;

const GRID = "#dddddd";
const AXIS = "#9297a0";
const TEXT = "#41454d";

export type ChartAxis = {
  /** Short unit, shown at the top corner. */
  unit: string;
  scale?: "linear" | "log";
  min: number;
  max: number;
  ticks: number[];
  format?: (value: number) => string;
};

export type ChartLine = {
  label: string;
  color: string;
  axis: "left" | "right";
  values: number[];
};

type Props = {
  /** X values in ascending order, starting at 0. */
  days: number[];
  xLabel: string;
  left: ChartAxis;
  right: ChartAxis;
  lines: ChartLine[];
  shadeFromDay?: number | null;
  shadeLabel?: string;
  ariaLabel: string;
};

const asText = (value: number, format?: (v: number) => string) =>
  format ? format(value) : String(value);

function axisProjector(axis: ChartAxis) {
  const span = Y1 - Y0;
  if (axis.scale === "log") {
    const lo = Math.log10(Math.max(axis.min, 1e-6));
    const hi = Math.log10(axis.max);
    return (value: number) =>
      Y1 - ((Math.log10(Math.max(value, axis.min)) - lo) / (hi - lo)) * span;
  }
  return (value: number) =>
    Y1 - ((value - axis.min) / (axis.max - axis.min)) * span;
}

export function ModelChart({
  days,
  xLabel,
  left,
  right,
  lines,
  shadeFromDay,
  shadeLabel,
  ariaLabel,
}: Props) {
  const dayMax = days[days.length - 1] || 1;
  const xPos = (day: number) => X0 + (day / dayMax) * (X1 - X0);
  const yLeft = axisProjector(left);
  const yRight = axisProjector(right);

  const xTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(dayMax * f));

  const polyline = (line: ChartLine) => {
    const project = line.axis === "left" ? yLeft : yRight;
    return line.values
      .map((value, i) => {
        const y = project(value);
        return `${xPos(days[i]).toFixed(1)},${(Number.isFinite(y) ? y : Y1).toFixed(1)}`;
      })
      .join(" ");
  };

  const showShade =
    typeof shadeFromDay === "number" && shadeFromDay >= 0 && shadeFromDay < dayMax;

  return (
    <figure className="w-full">
      <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-[12px] text-muted-ink">
        {lines.map((line) => (
          <span key={line.label} className="flex items-center gap-2">
            <span
              className="h-0.5 w-4"
              style={{ backgroundColor: line.color }}
              aria-hidden="true"
            />
            {line.label}
          </span>
        ))}
      </div>

      <svg
        viewBox="0 0 680 362"
        className="mt-2 w-full"
        role="img"
        aria-label={ariaLabel}
      >
        {left.ticks.map((tick) => {
          const y = yLeft(tick);
          return (
            <g key={`l-${tick}`}>
              <line x1={X0} x2={X1} y1={y} y2={y} stroke={GRID} strokeWidth="1" />
              <text x={X0 - 8} y={y + 3} textAnchor="end" fontSize="10" fill={TEXT}>
                {asText(tick, left.format)}
              </text>
            </g>
          );
        })}

        {right.ticks.map((tick) => (
          <text
            key={`r-${tick}`}
            x={X1 + 8}
            y={yRight(tick) + 3}
            textAnchor="start"
            fontSize="10"
            fill={TEXT}
          >
            {asText(tick, right.format)}
          </text>
        ))}

        <line x1={X0} x2={X1} y1={Y1} y2={Y1} stroke={AXIS} strokeWidth="1" />
        {xTicks.map((day, i) => (
          <text
            key={`x-${day}-${i}`}
            x={xPos(day)}
            y={Y1 + 18}
            textAnchor="middle"
            fontSize="10"
            fill={TEXT}
          >
            {day}
          </text>
        ))}
        <text
          x={(X0 + X1) / 2}
          y={Y1 + 36}
          textAnchor="middle"
          fontSize="10"
          fill={TEXT}
        >
          {xLabel}
        </text>

        <text x={X0} y={14} textAnchor="start" fontSize="10" fill={TEXT}>
          {left.unit}
        </text>
        <text x={X1} y={14} textAnchor="end" fontSize="10" fill={TEXT}>
          {right.unit}
        </text>

        {showShade ? (
          <g>
            <rect
              x={xPos(shadeFromDay as number)}
              y={Y0}
              width={X1 - xPos(shadeFromDay as number)}
              height={Y1 - Y0}
              fill="#aa2d00"
              fillOpacity="0.08"
            />
            {shadeLabel ? (
              <text
                x={(xPos(shadeFromDay as number) + X1) / 2}
                y={Y0 + 16}
                textAnchor="middle"
                fontSize="10"
                fontWeight="500"
                fill="#aa2d00"
              >
                {shadeLabel}
              </text>
            ) : null}
          </g>
        ) : null}

        {lines.map((line) => (
          <polyline
            key={line.label}
            points={polyline(line)}
            fill="none"
            stroke={line.color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>
    </figure>
  );
}
