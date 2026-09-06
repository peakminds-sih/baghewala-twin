import type { Metadata } from "next";
import { Container } from "@/components/site/container";
import { ModelExplorer } from "@/components/model/model-explorer";

export const metadata: Metadata = {
  title: "Model explorer",
  description:
    "Change the steam and pump inputs and watch the reduced-order Baghewala twin recompute temperature, viscosity, the safe pump speed, and the steam–oil ratio.",
};

export default function ModelPage() {
  return (
    <div className="bg-canvas pt-28 pb-16 md:pt-36 md:pb-24">
      <Container>
        <h1 className="text-[28px] leading-tight font-normal text-ink md:text-[32px]">
          Model explorer
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] text-body-text">
          The same causal chain the twin runs, made interactive. Set the steam
          cycle and the pump, and every output curve and number below recomputes
          from the equations in the technical reference.
        </p>

        <div className="mt-12">
          <ModelExplorer />
        </div>
      </Container>
    </div>
  );
}
