"use client";

import { createContext, useCallback, useContext, useState } from "react";

// Shares the hovered x value between charts, so hovering one chart shows the
// same day on all of them (DESIGN.md §6.3).

interface ChartSyncValue {
  hoverX: number | null;
  setHoverX: (x: number | null) => void;
}

const ChartSyncContext = createContext<ChartSyncValue | null>(null);

export function ChartSync({ children }: { children: React.ReactNode }) {
  const [hoverX, setHoverXState] = useState<number | null>(null);
  const setHoverX = useCallback((x: number | null) => setHoverXState(x), []);
  return <ChartSyncContext.Provider value={{ hoverX, setHoverX }}>{children}</ChartSyncContext.Provider>;
}

/** The shared hover value inside <ChartSync>, or a local one outside it. */
export function useChartHover(): [number | null, (x: number | null) => void] {
  const shared = useContext(ChartSyncContext);
  const [local, setLocal] = useState<number | null>(null);
  return shared ? [shared.hoverX, shared.setHoverX] : [local, setLocal];
}

/** Width of an element, kept up to date. 0 until the first measurement. */
export function useElementWidth<T extends HTMLElement>(): [(node: T | null) => (() => void) | undefined, number] {
  const [width, setWidth] = useState(0);
  const ref = useCallback((node: T | null) => {
    if (!node) return undefined;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}
