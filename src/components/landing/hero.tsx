import { Container } from "@/components/site/container";
import { ButtonLink } from "@/components/site/button-link";
import { HeroChart } from "./hero-chart";

export function Hero() {
  return (
    <section className="bg-cream pt-28 pb-16 md:pt-36 md:pb-24">
      <Container className="grid gap-12 md:grid-cols-2 md:items-center">
        <div className="min-w-0">
          <p className="text-caption font-medium text-ink-muted">
            SIH26120 · Oil India Limited · Software · Smart Automation
          </p>
          <h1 className="mt-4 font-serif text-h1 font-medium text-green md:text-display">
            One variable drives both decisions.
          </h1>
          <p className="mt-5 max-w-xl text-body text-ink">
            At Baghewala, one team plans the steam cycles and a different team
            sets the pump speed. The same thing controls both: reservoir
            temperature. This is a well-to-surface digital twin. It predicts that
            temperature, and it gives both decisions from the same prediction.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/documents">Read the documents</ButtonLink>
            <ButtonLink href="#how-it-works" variant="secondary">
              How it works
            </ButtonLink>
          </div>
        </div>
        <div className="min-w-0 md:pl-4">
          <HeroChart />
        </div>
      </Container>
    </section>
  );
}
