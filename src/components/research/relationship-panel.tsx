"use client";

import { MathText } from "@/components/kit/math-text";
import { Tag } from "@/components/kit/tag";
import { GROUPS, type Relationship } from "@/lib/research/relationships";
import { EquationCard } from "./equation-card";
import { RelationshipGraph } from "./relationship-graph";
import { useOutcome } from "./research-data";
import { TermTable } from "./terms";

// One relationship: its graph, what it says, the numbers the graph shows and
// the variables involved. In the "one at a time" view the equations appear
// in full below; in the "Everything" view they link to the equation cards.
export function RelationshipPanel({ relationship, mode }: { relationship: Relationship; mode: "one" | "all" }) {
  const { outcome, error } = useOutcome(relationship);
  const r = relationship;

  return (
    <article id={`rel-${r.id}`} className="scroll-mt-24">
      <p className="text-overline font-semibold uppercase text-ink-muted">{GROUPS[r.group]}</p>
      <h3 className="mt-1 font-serif text-h4 font-medium text-green sm:text-h3">
        <MathText text={r.from} /> <span className="text-ink-muted">→</span> <MathText text={r.to} />
      </h3>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Tag variant="neutral">{r.shape}</Tag>
        {mode === "all" ? (
          <span className="text-caption text-ink-muted">
            {r.equations.map((id, i) => (
              <span key={id}>
                {i > 0 ? " · " : ""}
                <a href={`#equation-${id}`} className="text-green underline-offset-4 hover:underline">
                  Equation {id}
                </a>
              </span>
            ))}
          </span>
        ) : (
          <span className="text-caption text-ink-muted">{r.equations.map((id) => `Equation ${id}`).join(" · ")}</span>
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <RelationshipGraph outcome={outcome} error={error} />
        <div className="min-w-0 space-y-4">
          <p className="max-w-[68ch] text-body text-ink">{r.summary}</p>
          {outcome ? (
            <ul className="space-y-2 text-ui text-ink">
              {outcome.facts.map((fact) => (
                <li key={fact} className="flex gap-2">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-green" aria-hidden="true" />
                  <span>{fact}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-ui text-ink-muted">The numbers appear when the graph is ready.</p>
          )}
          <div>
            <p className="mb-2 text-caption text-ink-muted">Variables involved</p>
            <TermTable terms={r.terms} />
          </div>
        </div>
      </div>

      {mode === "one" ? (
        <div className="mt-8 grid grid-cols-1 gap-4 xl:grid-cols-2">
          {r.equations.map((id) => (
            <EquationCard key={id} id={id} linkFeeds={false} />
          ))}
        </div>
      ) : null}
    </article>
  );
}
