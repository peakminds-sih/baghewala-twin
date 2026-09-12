"use client";

import { useMemo, useState } from "react";
import { EQUATIONS, EQUATION_IDS, INPUT_RANGES, VARIABLES, type EquationId, type InputKey, type VariableKey } from "@/lib/physics";
import { DURATION } from "@/lib/motion";
import { cn } from "@/lib/utils";

// How inputs, equations and outputs connect, left to right. Built from the
// inputs and outputs listed in EQUATIONS. Hover or focus a node to light up
// everything upstream and downstream of it; the rest fades back.

type NodeId = InputKey | VariableKey | "time" | `eq${EquationId}`;
type NodeKind = "input" | "time" | "equation" | "measured" | "inferred" | "derived";

interface MapNode {
  id: NodeId;
  kind: NodeKind;
  symbol: string;
  name: string;
  x: number;
  y: number;
}

// Columns, left to right. Equations sit between the values they link.
const COLUMNS: NodeId[][] = [
  ["steamVolumeM3", "steamQuality", "soakDays", "time", "strokeM", "pumpSpeedSPM"],
  ["eq1", "eq7"],
  ["steamEnthalpy", "heatedVolumeM3", "heatedRadiusM", "injectionDays", "daysSinceSteaming"],
  ["eq2"],
  ["tauDays", "reservoirTempC"],
  ["eq3"],
  ["viscosityCp"],
  ["eq4", "eq5"],
  ["inflowRateBblD", "pumpCapacityBblD", "flowRateBblD", "cumulativeOilBbl", "steamOilRatio", "safePumpSpeedSPM", "floatingRisk"],
  ["eq8"],
  ["wellheadTempC", "pumpLoadKN"],
];

// Short names that fit a node. The full names are in the tables.
const SHORT: Partial<Record<NodeId, string>> = {
  steamVolumeM3: "Steam volume",
  steamQuality: "Steam quality",
  soakDays: "Soak time",
  time: "Day in cycle",
  strokeM: "Stroke",
  pumpSpeedSPM: "Pump speed",
  steamEnthalpy: "Heat per kg",
  heatedVolumeM3: "Heated volume",
  heatedRadiusM: "Heated radius",
  injectionDays: "Injection length",
  daysSinceSteaming: "Days since steam",
  tauDays: "Cooling constant",
  reservoirTempC: "Temperature",
  viscosityCp: "Viscosity",
  inflowRateBblD: "Inflow",
  pumpCapacityBblD: "Pump capacity",
  flowRateBblD: "Oil rate",
  cumulativeOilBbl: "Cumulative oil",
  steamOilRatio: "Steam–oil ratio",
  safePumpSpeedSPM: "Safe speed",
  floatingRisk: "Floating risk",
  wellheadTempC: "Wellhead temp.",
  pumpLoadKN: "Rod load",
};

const NODE_W = 100;
const NODE_H = 40;
const EQ_R = 14;
const VALUE_COL = 108;
const EQ_COL = 44;
const GAP = 16;
const ROW = 50;
const PAD = 12;

const isEquation = (id: NodeId): id is `eq${EquationId}` => id.startsWith("eq");

function layout() {
  const maxRows = Math.max(...COLUMNS.map((c) => c.length));
  const height = PAD * 2 + maxRows * ROW;
  const nodes = new Map<NodeId, MapNode>();
  let x = PAD;
  COLUMNS.forEach((column) => {
    const eqColumn = isEquation(column[0]);
    const width = eqColumn ? EQ_COL : VALUE_COL;
    const top = (height - column.length * ROW) / 2 + ROW / 2;
    column.forEach((id, row) => {
      let kind: NodeKind;
      let symbol: string;
      let name: string;
      if (isEquation(id)) {
        const eq = EQUATIONS[Number(id.slice(2)) as EquationId];
        kind = "equation";
        symbol = String(eq.id);
        name = `Equation ${eq.id}: ${eq.title}`;
      } else if (id === "time") {
        kind = "time";
        symbol = "t";
        name = "Day in the cycle";
      } else if (id in INPUT_RANGES) {
        const r = INPUT_RANGES[id as InputKey];
        kind = "input";
        symbol = r.symbol;
        name = r.name;
      } else {
        const v = VARIABLES[id as VariableKey];
        kind = v.kind;
        symbol = v.symbol;
        name = v.name;
      }
      nodes.set(id, { id, kind, symbol, name, x: x + width / 2, y: top + row * ROW });
    });
    x += width + GAP;
  });
  const width = x - GAP + PAD;

  const edges: { from: NodeId; to: NodeId }[] = [];
  for (const id of EQUATION_IDS) {
    const eq = EQUATIONS[id];
    if (!eq.implemented) continue;
    const eqNode: NodeId = `eq${id}`;
    for (const term of eq.inputs) {
      const from: NodeId = term.kind === "time" ? "time" : term.key;
      if (nodes.has(from)) edges.push({ from, to: eqNode });
    }
    for (const out of eq.outputs) if (nodes.has(out)) edges.push({ from: eqNode, to: out });
  }
  return { nodes, edges, width, height };
}

const STROKE: Record<NodeKind, string> = {
  input: "var(--gold)",
  time: "var(--hairline-strong)",
  equation: "var(--green)",
  measured: "var(--ink)",
  inferred: "var(--green)",
  derived: "var(--hairline-strong)",
};

/** Symbol with an SVG subscript: "V_h" → V with subscript h. */
function SvgSymbol({ text }: { text: string }) {
  const cut = text.indexOf("_");
  const base = cut === -1 ? text : text.slice(0, cut);
  const sub = cut === -1 ? "" : text.slice(cut + 1);
  return (
    <>
      <tspan fontStyle={base.length === 1 ? "italic" : "normal"}>{base}</tspan>
      {sub ? (
        <tspan dy="3" fontSize="10">
          {sub}
        </tspan>
      ) : null}
    </>
  );
}

// The layout never changes, so it is computed once.
const LAYOUT = layout();

export function RelationshipMap({ highlight, className }: { highlight?: string[]; className?: string }) {
  const { nodes, edges, width, height } = LAYOUT;
  const [hovered, setHovered] = useState<NodeId | null>(null);

  // Everything upstream and downstream of the hovered node, or the given set.
  const lit = useMemo(() => {
    if (hovered) {
      const set = new Set<NodeId>([hovered]);
      const walk = (start: NodeId, forward: boolean) => {
        const queue = [start];
        while (queue.length) {
          const current = queue.shift() as NodeId;
          for (const e of edges) {
            const [a, b] = forward ? [e.from, e.to] : [e.to, e.from];
            if (a === current && !set.has(b)) {
              set.add(b);
              queue.push(b);
            }
          }
        }
      };
      walk(hovered, true);
      walk(hovered, false);
      return set;
    }
    if (highlight?.length) return new Set(highlight.filter((id) => nodes.has(id as NodeId)) as NodeId[]);
    return null;
  }, [hovered, highlight, edges, nodes]);

  const fade = { transition: `opacity ${DURATION.quick * 1000}ms var(--ease-out), stroke ${DURATION.quick * 1000}ms var(--ease-out)` };
  const on = (id: NodeId) => !lit || lit.has(id);

  return (
    <figure className={cn("min-w-0", className)}>
      <div className="overflow-x-auto rounded-lg border border-hairline bg-cream">
        <svg
          width={width}
          height={height}
          role="group"
          aria-label="Map of the model: inputs on the left, equations in the middle, outputs on the right. Focus a node to highlight what it depends on and what depends on it."
          className="block"
        >
          {edges.map((e, i) => {
            const a = nodes.get(e.from) as MapNode;
            const b = nodes.get(e.to) as MapNode;
            const x1 = a.x + (isEquation(a.id) ? EQ_R : NODE_W / 2);
            const x2 = b.x - (isEquation(b.id) ? EQ_R : NODE_W / 2);
            const mid = (x1 + x2) / 2;
            const active = !!lit && lit.has(e.from) && lit.has(e.to);
            return (
              <path
                key={i}
                d={`M${x1},${a.y} C${mid},${a.y} ${mid},${b.y} ${x2},${b.y}`}
                fill="none"
                stroke={active ? "var(--green)" : "var(--hairline-strong)"}
                strokeWidth={active ? 1.75 : 1}
                opacity={!lit || active ? 1 : 0.25}
                style={fade}
              />
            );
          })}
          {[...nodes.values()].map((n) => {
            const show = () => setHovered(n.id);
            const hide = () => setHovered(null);
            if (n.kind === "equation") {
              return (
                <g
                  key={n.id}
                  tabIndex={0}
                  aria-label={n.name}
                  onMouseEnter={show}
                  onMouseLeave={hide}
                  onFocus={show}
                  onBlur={hide}
                  opacity={on(n.id) ? 1 : 0.25}
                  style={fade}
                  className="cursor-default outline-none focus-visible:[&>circle]:stroke-gold"
                >
                  <title>{n.name}</title>
                  <circle cx={n.x} cy={n.y} r={EQ_R} fill="var(--green)" stroke="var(--cream)" strokeWidth="2" />
                  <text x={n.x} y={n.y} dy="0.35em" textAnchor="middle" className="fill-on-green text-[12px] font-semibold">
                    {n.symbol}
                  </text>
                </g>
              );
            }
            return (
              <g
                key={n.id}
                tabIndex={0}
                aria-label={n.name}
                onMouseEnter={show}
                onMouseLeave={hide}
                onFocus={show}
                onBlur={hide}
                opacity={on(n.id) ? 1 : 0.25}
                style={fade}
                className="cursor-default outline-none focus-visible:[&>rect]:stroke-gold"
              >
                <title>{n.name}</title>
                <rect
                  x={n.x - NODE_W / 2}
                  y={n.y - NODE_H / 2}
                  width={NODE_W}
                  height={NODE_H}
                  rx="4"
                  fill="var(--panel-raised)"
                  stroke={STROKE[n.kind]}
                  strokeWidth={n.kind === "derived" || n.kind === "time" ? 1 : 1.5}
                />
                <text x={n.x} y={n.y - 4} textAnchor="middle" className="fill-ink font-serif text-[14px]">
                  <SvgSymbol text={n.symbol} />
                </text>
                <text x={n.x} y={n.y + 12} textAnchor="middle" className="fill-ink-muted text-[10px]">
                  {SHORT[n.id] ?? n.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <figcaption className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-caption text-ink-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-5 rounded-[3px] border-[1.5px] border-gold" aria-hidden="true" /> Operator input
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-5 rounded-[3px] border-[1.5px] border-green" aria-hidden="true" /> Inferred
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-5 rounded-[3px] border-[1.5px] border-ink" aria-hidden="true" /> Measured
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-5 rounded-[3px] border border-hairline-strong" aria-hidden="true" /> Derived or time
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-full bg-green" aria-hidden="true" /> Equation
        </span>
      </figcaption>
    </figure>
  );
}
