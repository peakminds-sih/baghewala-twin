import { Section, SectionHeading } from "@/components/site/section";

const CARDS = [
  {
    title: "Observe.",
    body: "Find the current state of the well. This includes values that no sensor reports, such as oil viscosity and pump fillage.",
  },
  {
    title: "Predict.",
    body: "Calculate the cooling rate, the viscosity, the production decline, and the failure risk.",
  },
  {
    title: "Prescribe.",
    body: "Give the pump speed for today. Give the date and the steam volume for the next cycle.",
  },
];

export function WhatWeBuilt() {
  return (
    <Section surface="canvas">
      <SectionHeading
        title="A model of one well, running live"
        lead="A digital twin is a live software model of one specific well. The well's own sensors update it. It is not a general simulation. It is a model of this well, running on this well's data."
      />

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {CARDS.map((card) => (
          <div
            key={card.title}
            className="rounded-md border border-hairline bg-canvas p-6"
          >
            <h3 className="text-[16px] font-medium text-ink">{card.title}</h3>
            <p className="mt-3 text-[14px] text-body-text">{card.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 space-y-4 rounded-md border border-hairline bg-surface-soft p-6">
        <p className="text-[15px] text-ink">
          Objective: produce the most oil for each unit of steam. Constraint:
          keep the pump speed below the rod-floating limit.
        </p>
        <p className="text-[14px] text-body-text">
          Rod safety is a constraint, not the goal. If the goal were zero
          failures, the answer would be to run the pump at minimum speed forever.
          That gives almost no oil. An accurate safe limit lets the pump run near
          that limit instead of far below it.
        </p>
      </div>
    </Section>
  );
}
