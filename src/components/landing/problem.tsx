import { Section, SectionHeading } from "@/components/site/section";

const BLOCKS = [
  {
    title: "The oil does not flow.",
    body: "The crude is 14 to 19 degrees API. It has a viscosity near 11,500 cP at 46 to 50 °C. The reservoir pressure is low. Without help, the oil almost does not move.",
  },
  {
    title: "Steam works, but not for long.",
    body: "Steam makes the oil thin. The well then produces. Over the next weeks the heat moves into the cold rock around the well. The oil becomes thick again.",
  },
  {
    title: "The pump breaks.",
    body: "The rod string cannot fall fast enough through thick oil. It goes slack. The next stroke pulls it tight with a shock. The steel breaks after many shocks. Production then stops.",
  },
];

export function Problem() {
  return (
    <Section id="problem" surface="soft">
      <SectionHeading
        title="Heavy oil, cold rock, and a pump that keeps breaking"
        lead="You do not need an oil and gas background to follow this. Things cool down. Thick liquids resist movement. Metal breaks when you shock it many times."
      />

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {BLOCKS.map((block) => (
          <div key={block.title} className="rounded-md border border-hairline bg-cream p-6">
            <h3 className="text-h4 font-semibold text-ink">{block.title}</h3>
            <p className="mt-3 text-ui text-ink">{block.body}</p>
          </div>
        ))}
      </div>

      <blockquote className="mt-8 rounded-md border border-hairline bg-cream p-6">
        <p className="text-body text-ink">
          &ldquo;CSS cycle design and SRP operation are optimised separately,
          using historical experience.&rdquo;
        </p>
        <footer className="mt-2 text-caption text-ink-muted">
          From the problem statement.
        </footer>
      </blockquote>
    </Section>
  );
}
