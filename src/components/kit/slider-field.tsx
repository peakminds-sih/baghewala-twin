"use client";

import { useState } from "react";
import { Slider } from "@base-ui/react/slider";
import type { Tier } from "@/lib/physics";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TierTag } from "./tag";
import { MathText } from "./math-text";

// An operator input (DESIGN.md §5.3): label and editable value on one row,
// the slider below, the range ends and the tier under it. Part of the range
// outside field experience is marked with a gold band and a caption.

export interface SliderFieldProps {
  id: string;
  label: string;
  symbol?: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  tier?: Tier;
  /** The part of the range seen in field practice, when narrower. */
  fieldRange?: readonly [number, number];
  hint?: string;
  disabled?: boolean;
}

function decimalsOf(step: number): number {
  const text = String(step);
  const dot = text.indexOf(".");
  return dot === -1 ? 0 : text.length - dot - 1;
}

export function SliderField({
  id,
  label,
  symbol,
  unit,
  value,
  min,
  max,
  step,
  onChange,
  tier,
  fieldRange,
  hint,
  disabled,
}: SliderFieldProps) {
  const digits = decimalsOf(step);
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const commit = (text: string) => {
    const parsed = Number(text.replace(/,/g, ""));
    if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
      setError(`Enter a value from ${formatNumber(min, digits)} to ${formatNumber(max, digits)}.`);
      return;
    }
    const snapped = Number((Math.round((parsed - min) / step) * step + min).toFixed(digits));
    setError(null);
    setDraft(null);
    onChange(snapped);
  };

  const percent = (v: number) => ((v - min) / (max - min)) * 100;
  const outside: { left: number; width: number }[] = [];
  if (fieldRange) {
    if (fieldRange[0] > min) outside.push({ left: 0, width: percent(fieldRange[0]) });
    if (fieldRange[1] < max) outside.push({ left: percent(fieldRange[1]), width: 100 - percent(fieldRange[1]) });
  }

  return (
    <div className={cn(disabled && "opacity-60")}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={`${id}-value`} className="text-ui font-medium text-ink">
          {label}
          {symbol ? (
            <MathText text={symbol} className="ml-1.5 font-serif text-ink-muted" />
          ) : null}
        </label>
        <span className="flex items-baseline gap-1.5">
          <input
            id={`${id}-value`}
            inputMode="decimal"
            autoComplete="off"
            disabled={disabled}
            value={draft ?? formatNumber(value, digits)}
            onFocus={(event) => {
              setDraft(formatNumber(value, digits));
              event.currentTarget.select();
            }}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={(event) => commit(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") commit(event.currentTarget.value);
              if (event.key === "Escape") {
                setDraft(null);
                setError(null);
              }
            }}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            className={cn(
              "h-8 w-20 rounded-[4px] border bg-cream px-2 text-right text-ui tabular-nums text-ink",
              error ? "border-gold" : "border-hairline-strong",
            )}
          />
          <span className="w-12 text-caption text-ink-muted">{unit}</span>
        </span>
      </div>

      <Slider.Root
        value={value}
        onValueChange={(next) => {
          setError(null);
          setDraft(null);
          onChange(next);
        }}
        min={min}
        max={max}
        step={step}
        largeStep={step * 10}
        disabled={disabled}
        className="mt-2"
      >
        <Slider.Control className="relative flex h-6 w-full touch-none items-center select-none">
          <Slider.Track className="relative h-1 w-full rounded-full bg-hairline-strong">
            {outside.map((band, i) => (
              <span
                key={i}
                aria-hidden="true"
                className="absolute inset-y-[-3px] rounded-full bg-gold-tint"
                style={{ left: `${band.left}%`, width: `${band.width}%` }}
              />
            ))}
            <Slider.Indicator className="rounded-full bg-green" />
            <Slider.Thumb
              aria-label={label}
              className="size-4 rounded-full border-2 border-green bg-cream transition-[scale] duration-100 ease-out data-[dragging]:scale-125"
            />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>

      <div className="mt-1 flex items-center justify-between gap-2 text-caption text-ink-muted tabular-nums">
        <span>{formatNumber(min, digits)}</span>
        {tier ? <TierTag tier={tier} /> : null}
        <span>
          {formatNumber(max, digits)} {unit}
        </span>
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-caption text-gold-text">
          {error}
        </p>
      ) : null}
      {fieldRange && outside.length > 0 ? (
        <p className="mt-1 text-caption text-ink-muted">
          Field practice: {formatNumber(fieldRange[0], digits)}–{formatNumber(fieldRange[1], digits)} {unit}. The gold part of the
          track is outside it.
        </p>
      ) : null}
      {hint ? <p className="mt-1 text-caption text-ink-muted">{hint}</p> : null}
    </div>
  );
}
