"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { simulateCycle, type VariableKey } from "@/lib/physics";
import { nearestIndex } from "@/components/charts/scale";
import { SimulatorCharts } from "./charts";
import { CycleSummary } from "./cycle-summary";
import { DayControl, type PlaySpeed } from "./day-control";
import { EquationChain } from "./equation-chain";
import { ExportPanel } from "./export-panel";
import { InputsPanel } from "./inputs-panel";
import { DayReadouts } from "./readouts";
import { DEFAULT_INPUTS, toWellConfig, type SimulatorInputs } from "./state";

// The simulator page body. One cycle runs on the main thread (about 0.1 ms)
// every time an input moves, so charts follow the slider at once.

const START_PRODUCTION_DAY = 90; // opens on the day the worked case starts to bind

export function Simulator() {
  const [inputs, setInputs] = useState<SimulatorInputs>(DEFAULT_INPUTS);
  const result = useMemo(() => simulateCycle(toWellConfig(inputs)), [inputs]);
  const ts = useMemo(() => result.days.map((day) => day.t), [result]);
  const lastT = ts[ts.length - 1];

  // The chosen day is kept as a time. When inputs change the number of days,
  // the nearest recorded day is shown, so the choice always stays valid.
  const [selectedT, setSelectedT] = useState(() => result.phases.production.startT + START_PRODUCTION_DAY);
  const index = nearestIndex(ts, selectedT);
  const day = result.days[index];

  const [jump, setJump] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<PlaySpeed>("5");
  const playStart = useRef<{ t: number; time: number } | null>(null);

  const [hover, setHover] = useState<VariableKey | null>(null);
  const [pinned, setPinned] = useState<VariableKey | null>(null);

  // Playback: the day follows real time at `speed` days per second, with no
  // easing. The state changes only when the shown day changes.
  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let shown = -1;
    const tick = (now: number) => {
      const start = playStart.current;
      if (!start) return;
      const t = start.t + ((now - start.time) / 1000) * Number(speed);
      if (t >= lastT) {
        setSelectedT(lastT);
        setPlaying(false);
        return;
      }
      const i = nearestIndex(ts, t);
      if (i !== shown) {
        shown = i;
        setSelectedT(ts[i]);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, speed, ts, lastT]);

  const pickIndex = (i: number, animate: boolean) => {
    setPlaying(false);
    setJump(animate);
    setSelectedT(ts[i]);
  };

  const togglePlay = () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    const from = index >= ts.length - 1 ? ts[0] : ts[index];
    playStart.current = { t: from, time: performance.now() };
    setSelectedT(from);
    setJump(false);
    setPlaying(true);
  };

  const changeSpeed = (next: PlaySpeed) => {
    if (playing) playStart.current = { t: ts[index], time: performance.now() };
    setSpeed(next);
  };

  const changeInputs = (next: SimulatorInputs) => {
    setJump(false);
    setInputs(next);
  };

  const highlight = hover ?? pinned;
  const pin = (key: VariableKey) => setPinned((current) => (current === key ? null : key));

  return (
    <div className="space-y-12">
      <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-6 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto lg:pb-4">
          <InputsPanel inputs={inputs} onChange={changeInputs} />
          <ExportPanel />
        </aside>

        <div className="min-w-0 space-y-8">
          <SimulatorCharts
            result={result}
            markerX={day.t}
            markerAnimate={jump}
            onPickX={(x) => pickIndex(nearestIndex(ts, x), true)}
          />
          <DayControl
            days={result.days}
            index={index}
            onIndex={(i) => pickIndex(i, false)}
            playing={playing}
            onTogglePlay={togglePlay}
            speed={speed}
            onSpeed={changeSpeed}
          />
          <DayReadouts day={day} result={result} onHighlight={setHover} />
          <CycleSummary result={result} />
        </div>
      </div>

      <EquationChain day={day} result={result} highlight={highlight} onHighlight={setHover} onPin={pin} />
    </div>
  );
}
