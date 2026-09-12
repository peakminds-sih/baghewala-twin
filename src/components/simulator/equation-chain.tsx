"use client";

import { ArrowRight } from "lucide-react";
import {
  EQUATIONS,
  PARAM_INFO,
  VARIABLES,
  type CycleResult,
  type DayState,
  type EquationId,
  type VariableKey,
} from "@/lib/physics";
import { MathText } from "@/components/kit/math-text";
import { Panel } from "@/components/kit/panel";
import { cn } from "@/lib/utils";
import { producingEquation, termView, variableView, type TermView } from "./values";

// "How the numbers connect": each equation with its formula and the values
// that go in and come out on the current day. Hovering or focusing an
// output (here or in the readouts) highlights the equation that produced it
// and that equation's inputs. The highlight fades over 160 ms.

const ORDER: EquationId[] = [7, 1, 2, 3, 4, 5, 8];
const FLOW: { id: EquationId; label: string; output: VariableKey }[] = [
  { id: 1, label: "Heated zone", output: "heatedRadiusM" },
  { id: 2, label: "Temperature", output: "reservoirTempC" },
  { id: 3, label: "Viscosity", output: "viscosityCp" },
  { id: 4, label: "Oil rate", output: "flowRateBblD" },
  { id: 5, label: "Safe speed", output: "safePumpSpeedSPM" },
  { id: 8, label: "Sensor signals", output: "pumpLoadKN" },
];

function Row({
  view,
  emphasised,
  asButton,
  onHighlight,
  onPin,
}: {
  view: TermView;
  emphasised: boolean;
  asButton: boolean;
  onHighlight: (key: VariableKey | null) => void;
  onPin: (key: VariableKey) => void;
}) {
  const content = (
    <>
      <span className="min-w-0 truncate text-ink-muted">
        {view.name} <MathText text={view.symbol} className="font-serif text-ink" />
      </span>
      <span className="shrink-0 font-medium tabular-nums text-ink">
        {view.text}
        {view.unit ? <span className="ml-1 text-caption font-normal text-ink-muted">{view.unit}</span> : null}
      </span>
    </>
  );
  const className = cn(
    "flex w-full items-baseline justify-between gap-3 rounded-[4px] px-2 py-1 text-left text-ui transition-colors duration-[160ms] ease-out",
    emphasised && "bg-green-tint",
  );
  if (asButton && view.variable) {
    const key = view.variable;
    return (
      <button
        type="button"
        className={cn(className, "hover:bg-green-tint")}
        onMouseEnter={() => onHighlight(key)}
        onMouseLeave={() => onHighlight(null)}
        onFocus={() => onHighlight(key)}
        onBlur={() => onHighlight(null)}
        onClick={() => onPin(key)}
      >
        {content}
      </button>
    );
  }
  return <div className={className}>{content}</div>;
}

export function EquationChain({
  day,
  result,
  highlight,
  onHighlight,
  onPin,
}: {
  day: DayState;
  result: CycleResult;
  highlight: VariableKey | null;
  onHighlight: (key: VariableKey | null) => void;
  onPin: (key: VariableKey) => void;
}) {
  const activeEquation = highlight ? producingEquation(highlight, day) : null;

  return (
    <Panel title="How the numbers connect">
      <p className="max-w-[68ch] text-ui text-ink-muted">
        Each equation takes the values on the left of its arrow and produces the ones on the right. Hover a value, or
        a readout above, to see which equation made it. Values are for the day chosen on the day control.
      </p>

      <ol className="mt-5 flex flex-wrap items-center gap-2 text-ui" aria-label="The model chain">
        <li className="rounded-[4px] border border-hairline-strong px-2.5 py-1 text-ink-muted">Steam and pump settings</li>
        {FLOW.map((node) => (
          <li key={node.id} className="flex items-center gap-2">
            <ArrowRight className="size-4 text-ink-faint" aria-hidden="true" />
            <button
              type="button"
              onMouseEnter={() => onHighlight(node.output)}
              onMouseLeave={() => onHighlight(null)}
              onFocus={() => onHighlight(node.output)}
              onBlur={() => onHighlight(null)}
              onClick={() => onPin(node.output)}
              className={cn(
                "rounded-[4px] border px-2.5 py-1 transition-colors duration-[160ms] ease-out",
                activeEquation === node.id ? "border-green bg-green text-on-green" : "border-green text-green hover:bg-green-tint",
              )}
            >
              Eq {node.id} · {node.label}
            </button>
          </li>
        ))}
      </ol>

      <div className="mt-6 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {ORDER.map((id) => {
          const eq = EQUATIONS[id];
          const active = activeEquation === id;
          const inputs = eq.inputs.map((term) => termView(term, day, result));
          const outputs = eq.outputs.map((key) => variableView(key, day, result));
          return (
            <article
              key={id}
              aria-current={active ? "true" : undefined}
              className={cn(
                "flex min-w-0 flex-col rounded-lg border p-4 transition-colors duration-[160ms] ease-out",
                active ? "border-green bg-green-tint/60" : "border-hairline bg-cream",
              )}
            >
              <p className="text-overline font-semibold uppercase text-ink-muted">Equation {id}</p>
              <h3 className="mt-0.5 font-serif text-h4 font-medium text-green">{eq.title}</h3>
              <p className="text-caption text-ink-muted">{eq.status}</p>
              <div className="mt-3 space-y-1 overflow-x-auto pb-1 font-serif text-[16px] leading-7 whitespace-nowrap text-ink">
                {eq.formula.map((line) => (
                  <p key={line}>
                    <MathText text={line} />
                  </p>
                ))}
              </div>
              <p className="mt-2 text-caption text-ink-muted">{eq.summary}</p>

              <div className="mt-3 grid gap-3">
                <div>
                  <p className="px-2 text-overline font-semibold uppercase text-ink-muted">In</p>
                  {inputs.map((view) => (
                    <Row
                      key={view.id}
                      view={view}
                      emphasised={active || (view.variable !== null && view.variable === highlight)}
                      asButton={false}
                      onHighlight={onHighlight}
                      onPin={onPin}
                    />
                  ))}
                </div>
                <div>
                  <p className="px-2 text-overline font-semibold uppercase text-ink-muted">Out</p>
                  {outputs.map((view) => (
                    <Row
                      key={view.id}
                      view={view}
                      emphasised={view.variable === highlight}
                      asButton
                      onHighlight={onHighlight}
                      onPin={onPin}
                    />
                  ))}
                </div>
              </div>

              <p className="mt-auto pt-3 text-caption text-ink-muted">
                Constants:{" "}
                {eq.params.map((key, i) => (
                  <span key={key} title={`${PARAM_INFO[key].name}, tier ${PARAM_INFO[key].tier}`}>
                    {i > 0 ? " · " : ""}
                    <MathText text={PARAM_INFO[key].symbol} className="font-serif" />
                  </span>
                ))}
                {eq.feeds.length ? ` · Feeds ${eq.feeds.map((f) => `Eq ${f}`).join(", ")}` : ""}
              </p>
            </article>
          );
        })}
      </div>
      <p className="mt-4 text-caption text-ink-muted">
        {VARIABLES.cumulativeOilBbl.name} and {VARIABLES.steamOilRatio.name.toLowerCase()} are totals for the whole cycle,
        not values for one day. Equation 6 (rod dynamics) is not computed in v1.
      </p>
    </Panel>
  );
}
