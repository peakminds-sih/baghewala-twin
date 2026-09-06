import { Section, SectionHeading } from "@/components/site/section";

const RESULTS = [
  "More oil produced and recovered",
  "A lower steam-oil ratio",
  "Less energy for each barrel",
  "Fewer rod failures and pump unsettings",
  "Longer equipment life",
  "Decisions from data, not from habit",
];

const FIELD_VALUES = [
  { label: "Steam-oil ratio today", value: "3.0 to 5.2" },
  { label: "Recovery factor", value: "below 20 percent" },
  { label: "Field production", value: "about 655 barrels per day in July 2025" },
];

export function WhatChanges() {
  return (
    <Section surface="soft">
      <SectionHeading
        title="What changes"
        lead="Oil India lists six expected results. Not one of them is a technical measurement. All six are operational or financial."
      />

      <ol className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {RESULTS.map((result, i) => (
          <li
            key={result}
            className="flex gap-3 rounded-md border border-hairline bg-canvas p-5"
          >
            <span className="text-[13px] font-medium text-muted-ink">
              {i + 1}
            </span>
            <span className="text-[14px] text-ink">{result}</span>
          </li>
        ))}
      </ol>

      <div className="mt-8 rounded-md border border-hairline bg-canvas p-6">
        <dl className="grid gap-4 sm:grid-cols-3">
          {FIELD_VALUES.map((item) => (
            <div key={item.label}>
              <dt className="text-[13px] text-muted-ink">{item.label}</dt>
              <dd className="mt-1 text-[15px] text-ink">{item.value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-[12px] text-muted-ink">
          Published field values. Source: the problem statement and Oil India
          field reports.
        </p>
      </div>
    </Section>
  );
}
