"use client";

import { Slider } from "@base-ui/react/slider";
import type { ParamMeta } from "@/lib/model/twin";

function format(value: number, precision: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });
}

// One labelled slider for a single model input. Styled with the DESIGN.md tokens.
export function ParameterSlider({
  meta,
  value,
  onChange,
}: {
  meta: ParamMeta;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <Slider.Root
      value={value}
      onValueChange={(next) => onChange(next as number)}
      min={meta.min}
      max={meta.max}
      step={meta.step}
      className="block"
    >
      <div className="flex items-baseline justify-between gap-3">
        <Slider.Label className="text-[13px] font-medium text-ink">
          {meta.label}
        </Slider.Label>
        <span className="text-[13px] text-body-text tabular-nums">
          {format(value, meta.precision)}
          <span className="ml-1 text-muted-ink">{meta.unit}</span>
        </span>
      </div>

      <Slider.Control className="mt-2 flex h-5 w-full touch-none items-center select-none">
        <Slider.Track className="h-1 w-full rounded-full bg-surface-strong">
          <Slider.Indicator className="rounded-full bg-ink" />
          <Slider.Thumb className="size-4 rounded-full border-2 border-ink bg-canvas shadow-sm outline-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-link has-[:focus-visible]:ring-offset-2" />
        </Slider.Track>
      </Slider.Control>

      <p className="mt-1.5 text-[12px] leading-snug text-muted-ink">{meta.hint}</p>
    </Slider.Root>
  );
}
