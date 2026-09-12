import { Section, SectionHeading } from "@/components/site/section";

const FUNCTIONS = [
  {
    title: "Optimise the steam cycle.",
    body: "Select the steam volume, the injection pressure, the soak time, and the next steam date. Select them for the lowest steam-oil ratio, not from past practice.",
  },
  {
    title: "Predict heating, cooling, and production.",
    body: "Give a cooling curve and a production forecast for each well. Update them every day from live data.",
  },
  {
    title: "Set the pump speed continuously.",
    body: "Give a recommended speed for today. Calculate it again when conditions change. Send it to a drive that can act on it.",
  },
  {
    title: "Detect rod floating early.",
    body: "Calculate the safe speed limit from the current viscosity. Slow the pump before the rod string goes slack, not after a failure.",
  },
  {
    title: "Diagnose the pump condition.",
    body: "Compare the predicted dynamometer card against the measured card. The difference separates underfill, valve faults, leakage, and mechanical faults.",
  },
  {
    title: "Reduce steam and energy for each barrel.",
    body: "Steam is the operating cost of thermal recovery. Score every decision above against the same number.",
  },
];

export function WhatItDoes() {
  return (
    <Section surface="canvas">
      <SectionHeading
        title="What the system does"
        lead="Six functions. They match the six requirements in the problem statement."
      />

      <ol className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {FUNCTIONS.map((fn, i) => (
          <li key={fn.title} className="flex h-full flex-col rounded-md border border-hairline bg-cream p-6">
            <span className="text-caption font-medium text-ink-muted">{i + 1}</span>
            <h3 className="mt-2 text-h4 font-semibold text-ink">{fn.title}</h3>
            <p className="mt-2 text-ui text-ink">{fn.body}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
