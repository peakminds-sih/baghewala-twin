import type { Metadata } from "next";
import { Container } from "@/components/site/container";
import { Simulator } from "@/components/simulator/simulator";

export const metadata: Metadata = {
  title: "Simulator",
  description:
    "Run one steam cycle day by day. Set the steam and the pump, and see the temperature, viscosity, safe pump speed and oil rate the model predicts.",
};

export default function SimulatorPage() {
  return (
    <Container className="pt-24 pb-16">
      <header className="mb-10 max-w-[68ch]">
        <p className="text-overline font-semibold uppercase text-ink-muted">Simulator</p>
        <h1 className="mt-2 font-serif text-h2 font-medium text-green sm:text-display">One steam cycle, day by day</h1>
        <p className="mt-4 text-body-lg text-ink">
          Set the steam and the pump, then follow the well through injection, soak and production. Every value comes
          from the physics model in the technical reference. Values marked Inferred cannot be read at the well; only
          the model gives them.
        </p>
      </header>
      <Simulator />
    </Container>
  );
}
