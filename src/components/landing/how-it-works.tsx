import { cn } from "@/lib/utils";
import { Section, SectionHeading } from "@/components/site/section";

const STEPS = [
  {
    title: "Measure.",
    body: "Read the live sensor data: load, position, pressure, flow, temperature, and steam values.",
  },
  {
    title: "Estimate.",
    body: "Calculate the values that no sensor reports: reservoir temperature, viscosity, pump fillage, and rod load.",
  },
  {
    title: "Predict.",
    body: "Run the physics forward. Get the cooling, the production decline, and the failure risk for the next days and weeks.",
  },
  {
    title: "Optimise.",
    body: "Search the steam and pump settings. Find the lowest steam-oil ratio that keeps the pump speed safe.",
  },
  {
    title: "Recommend.",
    body: "Show the setting to the operator with the reason and the confidence. The operator approves it. The system does not act alone.",
  },
  {
    title: "Learn.",
    body: "Compare the result against the prediction. Correct the model.",
  },
];

export function HowItWorks() {
  return (
    <Section id="how-it-works" surface="soft">
      <SectionHeading
        title="Measure, predict, recommend, learn"
        lead="Physics does the calculation. The models learn where the physics is wrong. The models do not replace the physics."
      />

      <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {STEPS.map((step, i) => {
          const isApproval = i === 4;
          return (
            <li
              key={step.title}
              className={cn(
                "flex flex-col rounded-md border p-5",
                isApproval
                  ? "border-ink bg-cream ring-1 ring-ink"
                  : "border-hairline bg-cream"
              )}
            >
              <span className={cn("text-caption font-medium", isApproval ? "text-ink" : "text-ink-muted")}>
                Step {i + 1}
              </span>
              <h3 className="mt-2 text-ui font-semibold text-ink">{step.title}</h3>
              <p className="mt-2 text-caption text-ink">{step.body}</p>
              {isApproval ? (
                <p className="mt-3 text-caption font-medium text-ink">
                  The operator stays in control. This is a design decision.
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>
    </Section>
  );
}
