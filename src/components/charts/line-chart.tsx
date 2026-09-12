"use client";

import { useId, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { formatNumber } from "@/lib/format";
import { TRANSITION } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useChartHover, useElementWidth } from "./chart-sync";
import {
  linearScale,
  logDomain,
  logScale,
  logTicks,
  nearestIndex,
  niceDomain,
  niceTicks,
  type Scale,
} from "./scale";

// One line chart, drawn in SVG (DESIGN.md §6). Series are encoded by role:
// colour plus line style, so each still reads in grey scale. Only green,
// gold and ink carry series; that set passes the colour-vision checks in both
// themes. Colours come from CSS variables, so the chart follows the theme.

export type SeriesRole = "main" | "measured" | "limit" | "comparison";

export interface ChartPoint {
  x: number;
  y: number | null; // null leaves a gap
}

export interface ChartSeries {
  id: string;
  label: string;
  role: SeriesRole;
  points: readonly ChartPoint[];
  unit?: string;
  digits?: number;
  /** For several cases of one variable in one hue: 1, 0.7, 0.45, 0.25. */
  opacity?: number;
  /** Draw as steps (a value that holds until it changes, like a pump schedule). */
  step?: boolean;
}

export interface ChartBand {
  from: number;
  to: number;
  label?: string;
  /** gold and green are phase bands; risk is hatched gold (floating risk). */
  tone: "gold" | "green" | "risk";
}

export interface ChartArea {
  id: string;
  label: string;
  lower: readonly ChartPoint[];
  upper: readonly ChartPoint[];
}

export interface AxisSpec {
  label: string;
  scale?: "linear" | "log";
  min?: number;
  max?: number;
  ticks?: number[];
  format?: (value: number) => string;
}

export interface LineChartProps {
  title: string;
  subtitle?: string;
  series: ChartSeries[];
  x: AxisSpec;
  y: AxisSpec;
  bands?: ChartBand[];
  areas?: ChartArea[];
  /** Horizontal reference lines. The label sits at the right end unless align is "left". */
  rules?: { y: number; label: string; align?: "left" | "right" }[];
  /** The current day. `animate` moves it smoothly (a jump the user chose). */
  marker?: { x: number; label?: string; animate?: boolean } | null;
  height?: number;
  /** Text for the x value in the tooltip, for example "Day 42". */
  formatX?: (x: number) => string;
  onPickX?: (x: number) => void;
  className?: string;
}

const ROLE_STYLE: Record<SeriesRole, { stroke: string; width: number; dash?: string }> = {
  main: { stroke: "var(--green)", width: 2 },
  measured: { stroke: "var(--ink)", width: 1.5 },
  limit: { stroke: "var(--gold)", width: 1.5, dash: "6 4" },
  comparison: { stroke: "var(--ink)", width: 1.5, dash: "2 3" },
};

const BAND_FILL: Record<"gold" | "green", string> = { gold: "var(--gold-tint)", green: "var(--green-tint)" };

const MARGIN = { top: 16, bottom: 36, left: 52 };

function linePath(points: readonly ChartPoint[], sx: Scale, sy: Scale, step = false): string {
  let d = "";
  let open = false;
  for (const p of points) {
    if (p.y === null || !Number.isFinite(p.y)) {
      open = false;
      continue;
    }
    const px = sx(p.x).toFixed(1);
    const py = sy(p.y).toFixed(1);
    if (!open) d += `M${px},${py}`;
    else d += step ? `H${px}V${py}` : `L${px},${py}`;
    open = true;
  }
  return d;
}

function areaPath(lower: readonly ChartPoint[], upper: readonly ChartPoint[], sx: Scale, sy: Scale): string {
  const top = upper.filter((p) => p.y !== null).map((p) => `${sx(p.x).toFixed(1)},${sy(p.y as number).toFixed(1)}`);
  const bottom = lower
    .filter((p) => p.y !== null)
    .map((p) => `${sx(p.x).toFixed(1)},${sy(p.y as number).toFixed(1)}`)
    .reverse();
  return top.length && bottom.length ? `M${top.join("L")}L${bottom.join("L")}Z` : "";
}

function LineKey({ role, opacity = 1 }: { role: SeriesRole; opacity?: number }) {
  const style = ROLE_STYLE[role];
  return (
    <svg width="16" height="8" aria-hidden="true" className="shrink-0">
      <line x1="0" x2="16" y1="4" y2="4" stroke={style.stroke} strokeWidth={style.width + 0.5} strokeDasharray={style.dash} strokeOpacity={opacity} />
    </svg>
  );
}

export function LineChart({
  title,
  subtitle,
  series,
  x,
  y,
  bands = [],
  areas = [],
  rules = [],
  marker,
  height = 220,
  formatX = (v) => formatNumber(v, 0),
  onPickX,
  className,
}: LineChartProps) {
  const rawId = useId();
  const id = rawId.replace(/[^a-zA-Z0-9_-]/g, "");
  const reduceMotion = useReducedMotion();
  const [containerRef, width] = useElementWidth<HTMLDivElement>();
  const [hoverX, setHoverX] = useChartHover();
  const [pointerInside, setPointerInside] = useState(false);
  const [tableOpen, setTableOpen] = useState(false);

  const showLegend = series.length + areas.length >= 2;

  // Domains.
  const xs = series.flatMap((s) => s.points.map((p) => p.x));
  const xMin = x.min ?? Math.min(...xs);
  const xMax = x.max ?? Math.max(...xs);
  const ysAll = [
    ...series.flatMap((s) => s.points.map((p) => p.y)),
    ...areas.flatMap((a) => [...a.lower, ...a.upper].map((p) => p.y)),
    ...rules.map((r) => r.y),
  ].filter((v): v is number => v !== null && Number.isFinite(v));
  const log = y.scale === "log";
  const dataMin = ysAll.length ? Math.min(...ysAll) : 0;
  const dataMax = ysAll.length ? Math.max(...ysAll) : 1;
  const [yMin, yMax] = log
    ? logDomain(y.min ?? Math.max(dataMin, 1e-6), y.max ?? dataMax)
    : y.min !== undefined && y.max !== undefined
      ? [y.min, y.max]
      : niceDomain(y.min ?? dataMin, y.max ?? dataMax);

  // Direct end labels, only when there are two or more series and they do
  // not collide. The right margin makes room for them.
  const endLabelWidth = showLegend ? Math.min(128, 24 + Math.max(...series.map((s) => s.label.length)) * 6.2) : 12;
  const plotLeft = MARGIN.left;
  const plotRight = Math.max(plotLeft + 40, width - endLabelWidth);
  const plotTop = MARGIN.top;
  const plotBottom = height - MARGIN.bottom;

  const xLog = x.scale === "log";
  const sx = xLog ? logScale(xMin, xMax, plotLeft, plotRight) : linearScale(xMin, xMax, plotLeft, plotRight);
  const sy = log ? logScale(yMin, yMax, plotBottom, plotTop) : linearScale(yMin, yMax, plotBottom, plotTop);

  const yTicks = y.ticks ?? (log ? logTicks(yMin, yMax) : niceTicks(yMin, yMax, 4));
  const xTicks =
    x.ticks ?? (xLog ? logTicks(xMin, xMax) : niceTicks(xMin, xMax, Math.max(3, Math.floor((plotRight - plotLeft) / 70))));
  const formatY = y.format ?? ((v: number) => formatNumber(v, Math.abs(yMax - yMin) < 5 ? 1 : 0));

  const endLabels = series
    .map((s) => {
      const last = [...s.points].reverse().find((p) => p.y !== null && Number.isFinite(p.y));
      return last ? { id: s.id, label: s.label, role: s.role, opacity: s.opacity, py: sy(last.y as number) } : null;
    })
    .filter((v): v is NonNullable<typeof v> => v !== null)
    .sort((a, b) => a.py - b.py);
  const labelsFit = showLegend && endLabels.every((l, i) => i === 0 || l.py - endLabels[i - 1].py >= 14);

  // Hover: snap to the nearest x of the first series.
  const baseXs = series[0]?.points.map((p) => p.x) ?? [];
  const hoverIndex = hoverX === null ? -1 : nearestIndex(baseXs, hoverX);
  const snappedX = hoverIndex >= 0 ? baseXs[hoverIndex] : null;
  const hoverInRange = snappedX !== null && snappedX >= xMin && snappedX <= xMax;

  const xFromPointer = (event: React.PointerEvent<SVGRectElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    return sx.invert(plotLeft + (event.clientX - box.left));
  };

  const onKeyDown = (event: React.KeyboardEvent<SVGSVGElement>) => {
    if (!baseXs.length) return;
    const current = hoverIndex >= 0 ? hoverIndex : nearestIndex(baseXs, marker?.x ?? baseXs[0]);
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      const next = Math.min(baseXs.length - 1, Math.max(0, current + (event.key === "ArrowRight" ? 1 : -1)));
      setHoverX(baseXs[next]);
    } else if (event.key === "Enter" && onPickX && snappedX !== null) {
      onPickX(snappedX);
    } else if (event.key === "Escape") {
      setHoverX(null);
    }
  };

  const tooltipLeft = snappedX !== null ? sx(snappedX) : 0;
  const tooltipOnLeft = tooltipLeft > (plotLeft + plotRight) / 2;

  return (
    <figure className={cn("min-w-0", className)}>
      <figcaption className="mb-2">
        <p className="text-h4 font-semibold text-ink">{title}</p>
        {subtitle ? <p className="mt-0.5 text-caption text-ink-muted">{subtitle}</p> : null}
        <p className="mt-2 text-caption text-ink-muted">{y.label}</p>
      </figcaption>

      {showLegend ? (
        <ul className="mb-1 flex flex-wrap gap-x-4 gap-y-1 text-caption text-ink-muted">
          {series.map((s) => (
            <li key={s.id} className="flex items-center gap-1.5">
              <LineKey role={s.role} opacity={s.opacity} />
              {s.label}
            </li>
          ))}
          {areas.map((a) => (
            <li key={a.id} className="flex items-center gap-1.5">
              <span className="h-2 w-4 rounded-[2px] bg-green/15" aria-hidden="true" />
              {a.label}
            </li>
          ))}
        </ul>
      ) : null}

      <div ref={containerRef} className="relative w-full" style={{ height }}>
        {width > 0 ? (
          <svg
            width={width}
            height={height}
            role="img"
            aria-label={`${title}. ${y.label} against ${x.label}. Use the left and right arrow keys to read values.`}
            tabIndex={0}
            onKeyDown={onKeyDown}
            onBlur={() => setHoverX(null)}
            className="block overflow-visible outline-none focus-visible:outline-2 focus-visible:outline-gold"
          >
            <defs>
              <clipPath id={`${id}-plot`}>
                <motion.rect
                  x={plotLeft}
                  y={plotTop - 4}
                  width={plotRight - plotLeft}
                  height={plotBottom - plotTop + 8}
                  style={{ originX: 0 }}
                  initial={reduceMotion ? false : { scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={TRANSITION.draw}
                />
              </clipPath>
              <pattern id={`${id}-hatch`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="6" height="6" fill="var(--gold-tint)" />
                <line x1="0" y1="0" x2="0" y2="6" stroke="var(--gold)" strokeWidth="1.5" strokeOpacity="0.6" />
              </pattern>
            </defs>

            {/* Bands behind everything. */}
            {bands.map((band, i) => {
              const x0 = Math.max(plotLeft, sx(band.from));
              const x1 = Math.min(plotRight, sx(band.to));
              if (x1 <= x0) return null;
              return (
                <g key={i}>
                  <rect
                    x={x0}
                    y={plotTop}
                    width={x1 - x0}
                    height={plotBottom - plotTop}
                    fill={band.tone === "risk" ? `url(#${id}-hatch)` : BAND_FILL[band.tone]}
                  />
                  {band.label && x1 - x0 > band.label.length * 6 + 8 ? (
                    <text x={x0 + 4} y={plotTop + 11} className="fill-ink-muted text-[11px]">
                      {band.label}
                    </text>
                  ) : null}
                </g>
              );
            })}

            {/* Grid and y ticks. */}
            {yTicks.map((tick) => (
              <g key={tick}>
                <line x1={plotLeft} x2={plotRight} y1={sy(tick)} y2={sy(tick)} stroke="var(--hairline)" strokeWidth="1" />
                <text x={plotLeft - 8} y={sy(tick)} dy="0.32em" textAnchor="end" className="fill-ink-muted text-[11px] tabular-nums">
                  {formatY(tick)}
                </text>
              </g>
            ))}

            {/* x ticks and axis title. */}
            <line x1={plotLeft} x2={plotRight} y1={plotBottom} y2={plotBottom} stroke="var(--hairline-strong)" strokeWidth="1" />
            {xTicks.map((tick) => (
              <text key={tick} x={sx(tick)} y={plotBottom + 16} textAnchor="middle" className="fill-ink-muted text-[11px] tabular-nums">
                {x.format ? x.format(tick) : formatNumber(tick, 0)}
              </text>
            ))}
            <text x={(plotLeft + plotRight) / 2} y={height - 4} textAnchor="middle" className="fill-ink-muted text-[11px]">
              {x.label}
            </text>

            {/* Reference rules. Their labels are drawn later, above the data and the day marker. */}
            {rules.map((rule) => (
              <line key={rule.label} x1={plotLeft} x2={plotRight} y1={sy(rule.y)} y2={sy(rule.y)} stroke="var(--hairline-strong)" strokeWidth="1" />
            ))}

            {/* Data, revealed once from left to right. */}
            <g clipPath={`url(#${id}-plot)`}>
              {areas.map((area) => (
                <path key={area.id} d={areaPath(area.lower, area.upper, sx, sy)} fill="var(--green)" fillOpacity="0.12" />
              ))}
              {series.map((s) => {
                const style = ROLE_STYLE[s.role];
                return (
                  <path
                    key={s.id}
                    d={linePath(s.points, sx, sy, s.step)}
                    fill="none"
                    stroke={style.stroke}
                    strokeWidth={style.width}
                    strokeDasharray={style.dash}
                    strokeOpacity={s.opacity ?? 1}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                );
              })}
            </g>

            {/* Direct end labels: text colour, keyed by a short line. */}
            {labelsFit
              ? endLabels.map((l) => (
                  <g key={l.id} transform={`translate(${plotRight + 6},${l.py})`}>
                    <line x1="0" x2="10" y1="0" y2="0" stroke={ROLE_STYLE[l.role].stroke} strokeWidth="2" strokeOpacity={l.opacity ?? 1} strokeDasharray={ROLE_STYLE[l.role].dash} />
                    <text x="14" dy="0.32em" className="fill-ink-muted text-[11px]">
                      {l.label}
                    </text>
                  </g>
                ))
              : null}

            {/* Current day. */}
            {marker && marker.x >= xMin && marker.x <= xMax ? (
              <motion.g
                initial={false}
                animate={{ transform: `translateX(${sx(marker.x)}px)` }}
                transition={marker.animate && !reduceMotion ? TRANSITION.move : { duration: 0 }}
              >
                <line x1="0" x2="0" y1={plotTop} y2={plotBottom} stroke="var(--gold)" strokeWidth="2" />
                {marker.label ? (
                  <text
                    x="0"
                    y={plotTop - 4}
                    textAnchor="middle"
                    stroke="var(--cream)"
                    strokeWidth="4"
                    strokeLinejoin="round"
                    paintOrder="stroke"
                    className="fill-ink-muted text-[11px]"
                  >
                    {marker.label}
                  </text>
                ) : null}
              </motion.g>
            ) : null}

            {/* Rule labels, with a halo in the ground colour so a line or the day marker never hides them. */}
            {rules.map((rule) => (
              <text
                key={rule.label}
                x={rule.align === "left" ? plotLeft + 4 : plotRight - 4}
                y={sy(rule.y) - 4}
                textAnchor={rule.align === "left" ? "start" : "end"}
                stroke="var(--cream)"
                strokeWidth="4"
                strokeLinejoin="round"
                paintOrder="stroke"
                className="fill-ink-muted text-[11px]"
              >
                {rule.label}
              </text>
            ))}

            {/* Crosshair and dots at the hovered x. */}
            {hoverInRange && snappedX !== null ? (
              <g pointerEvents="none">
                <line x1={sx(snappedX)} x2={sx(snappedX)} y1={plotTop} y2={plotBottom} stroke="var(--ink-muted)" strokeWidth="1" />
                {series.map((s) => {
                  const p = s.points[nearestIndex(s.points.map((q) => q.x), snappedX)];
                  if (!p || p.y === null || !Number.isFinite(p.y)) return null;
                  return (
                    <circle
                      key={s.id}
                      cx={sx(p.x)}
                      cy={sy(p.y)}
                      r="4"
                      fill={ROLE_STYLE[s.role].stroke}
                      fillOpacity={s.opacity ?? 1}
                      stroke="var(--cream)"
                      strokeWidth="2"
                    />
                  );
                })}
              </g>
            ) : null}

            {/* Hit area: the whole plot, larger than any mark. */}
            <rect
              x={plotLeft}
              y={plotTop}
              width={plotRight - plotLeft}
              height={plotBottom - plotTop}
              fill="transparent"
              className={onPickX ? "cursor-pointer" : undefined}
              onPointerMove={(event) => {
                setPointerInside(true);
                setHoverX(xFromPointer(event));
              }}
              onPointerLeave={() => {
                setPointerInside(false);
                setHoverX(null);
              }}
              onClick={(event) => {
                if (!onPickX) return;
                const i = nearestIndex(baseXs, sx.invert(plotLeft + (event.clientX - event.currentTarget.getBoundingClientRect().left)));
                if (i >= 0) onPickX(baseXs[i]);
              }}
            />
          </svg>
        ) : null}

        {/* Tooltip: values lead, labels follow. Only in the chart under the pointer or with focus. */}
        {hoverInRange && snappedX !== null && (pointerInside || hoverIndex >= 0) && width > 0 ? (
          <div
            className="pointer-events-none absolute top-0 z-10 min-w-40 rounded-[4px] border border-hairline bg-panel-raised px-3 py-2 shadow-pop animate-in fade-in duration-150"
            style={tooltipOnLeft ? { right: width - tooltipLeft + 12 } : { left: tooltipLeft + 12 }}
          >
            <p className="text-caption text-ink-muted">{formatX(snappedX)}</p>
            <ul className="mt-1 space-y-0.5">
              {series.map((s) => {
                const p = s.points[nearestIndex(s.points.map((q) => q.x), snappedX)];
                return (
                  <li key={s.id} className="flex items-center gap-2 text-ui">
                    <LineKey role={s.role} opacity={s.opacity} />
                    <span className="font-semibold text-ink tabular-nums">
                      {p && p.y !== null && Number.isFinite(p.y) ? formatNumber(p.y, s.digits ?? 1) : "—"}
                    </span>
                    {s.unit ? <span className="text-caption text-ink-muted">{s.unit}</span> : null}
                    <span className="text-caption text-ink-muted">{s.label}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>

      <details className="mt-2" onToggle={(event) => setTableOpen(event.currentTarget.open)}>
        <summary className="cursor-pointer text-caption text-green underline-offset-4 hover:underline">Data table</summary>
        {tableOpen ? (
          <div className="mt-2 max-h-64 overflow-auto rounded-[4px] border border-hairline">
            <table className="w-full text-ui tabular-nums">
              <thead className="sticky top-0 bg-panel text-caption text-ink-muted">
                <tr>
                  <th className="px-3 py-1.5 text-left font-medium">{x.label}</th>
                  {series.map((s) => (
                    <th key={s.id} className="px-3 py-1.5 text-right font-medium">
                      {s.label}
                      {s.unit ? ` (${s.unit})` : ""}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {baseXs.map((bx, i) => (
                  <tr key={i} className="border-t border-hairline">
                    <td className="px-3 py-1 text-left">{formatX(bx)}</td>
                    {series.map((s) => {
                      const p = s.points[i];
                      return (
                        <td key={s.id} className="px-3 py-1 text-right">
                          {p && p.y !== null && Number.isFinite(p.y) ? formatNumber(p.y, s.digits ?? 1) : "—"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </details>
    </figure>
  );
}
