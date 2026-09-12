import { Container } from "@/components/site/container";

const NOTES = [
  "Our viscosity curve uses one measured point. A correct fit needs two. A second measurement is our highest-value data request.",
  "Our rod-floating limit is a static force balance. It ignores rod stretch and wave effects, so it reads high. We will calibrate it against the real failure history.",
  "We hold the reservoir pressure constant in version one. It drives the inflow directly, so a depletion term is the next addition.",
  "The crude is non-Newtonian. Its thickness depends on shear rate and on temperature. We know this refinement. We will not build it until the main chain works.",
];

// Quiet engineering note, not a warning: muted surface, smaller type.
export function NotClaimed() {
  return (
    <section className="scroll-mt-16 bg-cream py-16 md:py-24">
      <Container>
        <div className="rounded-md border border-hairline bg-panel p-6 md:p-10">
          <h2 className="text-h4 font-normal text-ink-muted">
            What we do not claim yet
          </h2>
          <p className="mt-3 max-w-2xl text-caption text-ink-muted">
            Every parameter in our model has a value, a unit, a source, and a
            confidence level. These four are still assumptions.
          </p>
          <ol className="mt-6 space-y-3">
            {NOTES.map((note, i) => (
              <li key={i} className="flex gap-3 text-caption text-ink-muted">
                <span className="shrink-0 font-medium">{i + 1}.</span>
                <span>{note}</span>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
