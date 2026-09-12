import { Fragment } from "react";
import { MathText } from "@/components/kit/math-text";
import { Tag } from "@/components/kit/tag";
import { EQUATIONS, INPUT_RANGES, VARIABLES, type EquationId, type EquationTerm } from "@/lib/physics";
import { termInfo } from "./terms";

// One equation (technical reference, section 4): what it says, what goes in,
// what comes out, and the constants it uses.

function termLabel(term: EquationTerm): { symbol: string; name: string } {
  if (term.kind === "input") return { symbol: INPUT_RANGES[term.key].symbol, name: INPUT_RANGES[term.key].name };
  if (term.kind === "variable") return { symbol: VARIABLES[term.key].symbol, name: VARIABLES[term.key].name };
  return { symbol: "t", name: "Day in the cycle" };
}

function Chip({ symbol, name }: { symbol: string; name: string }) {
  return (
    <span className="inline-flex items-baseline gap-1.5 rounded-[4px] border border-hairline bg-cream px-2 py-0.5 text-ui text-ink">
      <MathText text={symbol} className="font-serif" />
      <span className="text-ink-muted">{name}</span>
    </span>
  );
}

export function EquationCard({
  id,
  showParams = true,
  linkFeeds = true,
}: {
  id: EquationId;
  showParams?: boolean;
  /** Link "feeds" to the other equation cards (the "Everything" view). */
  linkFeeds?: boolean;
}) {
  const eq = EQUATIONS[id];
  const isPhysics = eq.status.startsWith("Physics");

  return (
    <article id={`equation-${id}`} className="scroll-mt-24 rounded-lg border border-hairline bg-panel p-4 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="font-serif text-h4 font-medium text-green">
          Equation {id} · {eq.title}
        </h3>
        <span className="flex flex-wrap gap-1.5">
          {isPhysics ? <Tag variant="neutral">Physics</Tag> : <Tag variant="D">Assumption</Tag>}
          {!eq.implemented ? <Tag variant="neutral">Not computed in v1</Tag> : null}
        </span>
      </header>
      <p className="mt-1 text-caption text-ink-muted">
        {eq.status}. Source: {eq.source}.
      </p>

      <div className="mt-4 space-y-1 overflow-x-auto font-serif text-[17px] leading-8 text-ink sm:text-[19px]">
        {eq.formula.map((line) => (
          <p key={line} className="whitespace-nowrap">
            <MathText text={line} />
          </p>
        ))}
      </div>

      <p className="mt-3 max-w-[68ch] text-ui text-ink">{eq.summary}</p>

      {eq.inputs.length > 0 ? (
        <dl className="mt-4 grid gap-3 text-ui sm:grid-cols-[auto_1fr]">
          <dt className="pt-0.5 text-caption text-ink-muted">In</dt>
          <dd className="flex flex-wrap gap-1.5">
            {eq.inputs.map((term, i) => (
              <Chip key={i} {...termLabel(term)} />
            ))}
          </dd>
          <dt className="pt-0.5 text-caption text-ink-muted">Out</dt>
          <dd className="flex flex-wrap gap-1.5">
            {eq.outputs.map((key) => (
              <Chip key={key} symbol={VARIABLES[key].symbol} name={VARIABLES[key].name} />
            ))}
          </dd>
        </dl>
      ) : null}

      {showParams && eq.params.length > 0 ? (
        <div className="mt-4 overflow-x-auto rounded-[4px] border border-hairline">
          <table className="w-full min-w-[480px] text-ui">
            <thead className="bg-panel text-caption text-ink-muted">
              <tr>
                <th className="px-3 py-1.5 text-left font-medium">Symbol</th>
                <th className="px-3 py-1.5 text-left font-medium">Constant</th>
                <th className="px-3 py-1.5 text-right font-medium">Value</th>
                <th className="px-3 py-1.5 text-left font-medium">Source</th>
              </tr>
            </thead>
            <tbody>
              {eq.params.map((key) => {
                const row = termInfo({ kind: "param", key });
                return (
                  <tr key={key} className="border-t border-hairline align-top">
                    <td className="px-3 py-1.5 font-serif text-[15px] whitespace-nowrap text-ink">
                      <MathText text={row.symbol} />
                    </td>
                    <td className="px-3 py-1.5 text-ink">{row.name}</td>
                    <td className="px-3 py-1.5 text-right whitespace-nowrap tabular-nums text-ink">
                      {row.value}
                      {row.unit !== "—" && row.unit !== "fraction" ? <span className="text-ink-muted"> {row.unit}</span> : null}
                    </td>
                    <td className="px-3 py-1.5">
                      <span className="flex flex-wrap gap-1">{row.tags}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {eq.feeds.length > 0 ? (
        <p className="mt-3 text-caption text-ink-muted">
          Feeds{" "}
          {eq.feeds.map((next, i) => (
            <Fragment key={next}>
              {i > 0 ? ", " : ""}
              {linkFeeds ? (
                <a href={`#equation-${next}`} className="text-green underline-offset-4 hover:underline">
                  equation {next}
                </a>
              ) : (
                `equation ${next}`
              )}
            </Fragment>
          ))}
          .
        </p>
      ) : null}
    </article>
  );
}
