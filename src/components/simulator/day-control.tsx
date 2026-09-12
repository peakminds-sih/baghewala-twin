"use client";

import { Slider } from "@base-ui/react/slider";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import type { DayState } from "@/lib/physics";
import { Segmented } from "@/components/kit/segmented";
import { cn } from "@/lib/utils";
import { formatDay } from "./values";

// The day-by-day time control (DESIGN.md §5.6). The track shows the three
// phases as bands. Space plays or pauses and the arrow keys step one day,
// but only while the control has focus.

export const PLAY_SPEEDS = ["1", "5", "20"] as const;
export type PlaySpeed = (typeof PLAY_SPEEDS)[number];

const iconButton =
  "inline-flex size-9 items-center justify-center rounded-[4px] border border-hairline-strong bg-cream text-ink transition-[border-color,scale] duration-100 ease-out hover:border-ink-muted active:scale-[0.98] disabled:text-ink-faint";

export function DayControl({
  days,
  index,
  onIndex,
  playing,
  onTogglePlay,
  speed,
  onSpeed,
}: {
  days: readonly DayState[];
  index: number;
  onIndex: (index: number) => void;
  playing: boolean;
  onTogglePlay: () => void;
  speed: PlaySpeed;
  onSpeed: (speed: PlaySpeed) => void;
}) {
  const last = days.length - 1;
  const day = days[index];
  const count = (phase: DayState["phase"]) => days.filter((d) => d.phase === phase).length;
  const injection = count("injection");
  const soak = count("soak");
  const pct = (i: number) => (last > 0 ? (i / last) * 100 : 0);
  const bands = [
    { label: "Injection", from: 0, to: injection, className: "bg-gold-tint" },
    { label: "Soak", from: injection, to: injection + soak, className: "bg-green-tint" },
    { label: "Production", from: injection + soak, to: last, className: "" },
  ];

  return (
    <div
      role="group"
      aria-label="Day control"
      className="rounded-lg border border-hairline bg-panel p-4 sm:p-6"
      onKeyDown={(event) => {
        // Space on the day slider plays or pauses. Buttons keep their own space behaviour.
        if (event.key === " " && (event.target as HTMLElement).tagName === "INPUT") {
          event.preventDefault();
          onTogglePlay();
        }
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-ui text-ink" aria-live="polite">
          <span className="font-semibold tabular-nums">{formatDay(day.t)}</span>
          <span className="text-ink-muted">
            {" "}
            · {day.phase} day {day.phaseDay}
          </span>
        </p>
        <div className="flex items-center gap-2">
          <button type="button" className={iconButton} aria-label="Previous day" onClick={() => onIndex(Math.max(0, index - 1))} disabled={index === 0}>
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            className={cn(iconButton, "w-auto gap-2 px-3 text-ui font-medium")}
            onClick={onTogglePlay}
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause className="size-4" aria-hidden="true" /> : <Play className="size-4" aria-hidden="true" />}
            {playing ? "Pause" : "Play"}
          </button>
          <button type="button" className={iconButton} aria-label="Next day" onClick={() => onIndex(Math.min(last, index + 1))} disabled={index === last}>
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
          <Segmented
            label="Playback speed, days per second"
            options={PLAY_SPEEDS.map((s) => ({ value: s, label: `${s}×` }))}
            value={speed}
            onChange={onSpeed}
          />
        </div>
      </div>

      <Slider.Root
        value={index}
        onValueChange={(next) => onIndex(next)}
        min={0}
        max={last}
        step={1}
        largeStep={10}
        className="mt-4"
      >
        <Slider.Control className="relative flex h-10 w-full touch-none items-center select-none">
          <Slider.Track className="relative h-2 w-full overflow-visible rounded-[2px] bg-cream ring-1 ring-hairline-strong">
            {bands.map((band) =>
              band.className ? (
                <span
                  key={band.label}
                  aria-hidden="true"
                  className={cn("absolute inset-y-0", band.className)}
                  style={{ left: `${pct(band.from)}%`, width: `${pct(band.to) - pct(band.from)}%` }}
                />
              ) : null,
            )}
            <Slider.Thumb
              aria-label="Day"
              getAriaValueText={() => `${formatDay(day.t)}, ${day.phase} day ${day.phaseDay}`}
              className="h-6 w-1 rounded-[2px] bg-gold outline-offset-4"
            />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>

      {/* A legend, not labels under the bands: the soak band is too narrow to hold its name. */}
      <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-caption text-ink-muted">
        {bands.map((band) => (
          <li key={band.label} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className={cn("h-2 w-4 rounded-[2px] ring-1 ring-hairline-strong", band.className || "bg-cream")}
            />
            {band.label}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-caption text-ink-muted">
        With the day slider focused, press space to play or pause and the arrow keys to step one day. Click a chart to
        jump to a day.
      </p>
    </div>
  );
}
