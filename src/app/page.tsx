import { Hero } from "@/components/landing/hero";
import { Problem } from "@/components/landing/problem";
import { TwoFailures } from "@/components/landing/two-failures";
import { WhatWeBuilt } from "@/components/landing/what-we-built";
import { HowItWorks } from "@/components/landing/how-it-works";
import { WhatItDoes } from "@/components/landing/what-it-does";
import { ModelPreview } from "@/components/landing/model-preview";
import { WhatChanges } from "@/components/landing/what-changes";
import { NotClaimed } from "@/components/landing/not-claimed";
import { DocumentsPreview } from "@/components/landing/documents-preview";
import { TeamPreview } from "@/components/landing/team-preview";
import { FinalCta } from "@/components/landing/final-cta";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Problem />
      <TwoFailures />
      <WhatWeBuilt />
      <HowItWorks />
      <WhatItDoes />
      <ModelPreview />
      <WhatChanges />
      <NotClaimed />
      <DocumentsPreview />
      <TeamPreview />
      <FinalCta />
    </>
  );
}
