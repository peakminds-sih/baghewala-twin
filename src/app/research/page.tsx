import type { Metadata } from "next";
import { TierTag } from "@/components/kit/tag";
import { ResearchExplorer, type ResearchView } from "@/components/research/research-explorer";
import { Container } from "@/components/site/container";
import { TIER_INFO, type Tier } from "@/lib/physics";
import { RELATIONSHIPS, RELATIONSHIP_BY_ID } from "@/lib/research/relationships";

export const metadata: Metadata = {
  title: "Research",
  description:
    "Every equation, every variable with its unit, range and source, and how each input moves each output in the Baghewala digital twin.",
};

export default async function ResearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const view: ResearchView = params.view === "all" ? "all" : "one";
  const rel = typeof params.rel === "string" && RELATIONSHIP_BY_ID.has(params.rel) ? params.rel : RELATIONSHIPS[0].id;

  return (
    <Container className="pt-28 pb-24">
      <header className="mb-10 max-w-[68ch]">
        <p className="text-overline font-semibold uppercase text-ink-muted">Research</p>
        <h1 className="mt-2 font-serif text-h1 font-medium text-green sm:text-display">How the model works</h1>
        <p className="mt-4 text-body-lg text-ink">
          Every equation, every variable and every link between them. Each number on this page comes from the same physics code the
          simulator runs. Nothing is typed in by hand.
        </p>
        <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-caption text-ink-muted">
          {(Object.keys(TIER_INFO) as Tier[]).map((tier) => (
            <li key={tier} className="flex items-center gap-1.5">
              <TierTag tier={tier} />
              {TIER_INFO[tier].description}
            </li>
          ))}
        </ul>
      </header>
      <ResearchExplorer initialView={view} initialRelId={rel} />
    </Container>
  );
}
