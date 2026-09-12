"use client";

import { LineChart } from "@/components/charts/line-chart";
import type { Outcome } from "@/lib/research/relationships";

// A relationship's graph, or a quiet placeholder while the worker computes it.
// The placeholder keeps the same height, so the page does not jump.
export function RelationshipGraph({
  outcome,
  error,
  height = 240,
}: {
  outcome: Outcome | null;
  error: string | null;
  height?: number;
}) {
  if (error) {
    return <p className="text-ui text-gold-text">This graph could not be computed: {error}</p>;
  }
  if (!outcome) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-dashed border-hairline-strong text-ui text-ink-muted"
        style={{ height: height + 96 }}
        role="status"
      >
        Computing in the background…
      </div>
    );
  }
  const g = outcome.graph;
  return (
    <LineChart
      title={g.title}
      subtitle={g.subtitle}
      series={g.series}
      x={g.x}
      y={g.y}
      bands={g.bands}
      areas={g.areas}
      rules={g.rules}
      marker={g.marker}
      formatX={g.formatX}
      height={height}
    />
  );
}
