// Small scale helpers for the SVG charts. No dependencies.

export interface Scale {
  (value: number): number;
  invert: (pixel: number) => number;
}

export function linearScale(d0: number, d1: number, r0: number, r1: number): Scale {
  const span = d1 - d0 || 1;
  const k = (r1 - r0) / span;
  const scale = ((value: number) => r0 + (value - d0) * k) as Scale;
  scale.invert = (pixel) => d0 + (pixel - r0) / k;
  return scale;
}

export function logScale(d0: number, d1: number, r0: number, r1: number): Scale {
  const l0 = Math.log10(d0);
  const l1 = Math.log10(d1);
  const inner = linearScale(l0, l1, r0, r1);
  const scale = ((value: number) => inner(Math.log10(Math.max(value, Number.MIN_VALUE)))) as Scale;
  scale.invert = (pixel) => 10 ** inner.invert(pixel);
  return scale;
}

function niceStep(rough: number): number {
  const power = 10 ** Math.floor(Math.log10(rough));
  const unit = rough / power;
  return (unit >= 5 ? 10 : unit >= 2 ? 5 : unit >= 1 ? 2 : 1) * power;
}

/** A rounded domain that contains [min, max]. */
export function niceDomain(min: number, max: number, count = 4): [number, number] {
  if (min === max) return [min - 1, max + 1];
  const step = niceStep((max - min) / count);
  return [Math.floor(min / step) * step, Math.ceil(max / step) * step];
}

/** About `count` round ticks inside [min, max]. */
export function niceTicks(min: number, max: number, count = 4): number[] {
  const step = niceStep((max - min) / count);
  const ticks: number[] = [];
  for (let v = Math.ceil(min / step - 1e-9) * step; v <= max + step * 1e-9; v += step) {
    ticks.push(Number(v.toPrecision(12)));
  }
  return ticks;
}

/** Powers of ten that span [min, max]. */
export function logDomain(min: number, max: number): [number, number] {
  return [10 ** Math.floor(Math.log10(min)), 10 ** Math.ceil(Math.log10(max))];
}

export function logTicks(min: number, max: number): number[] {
  const ticks: number[] = [];
  for (let e = Math.ceil(Math.log10(min) - 1e-9); e <= Math.log10(max) + 1e-9; e++) ticks.push(10 ** e);
  return ticks;
}

/** Index of the point whose x is nearest to `x`. Points are sorted by x. */
export function nearestIndex(xs: readonly number[], x: number): number {
  if (xs.length === 0) return -1;
  let lo = 0;
  let hi = xs.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (xs[mid] < x) lo = mid;
    else hi = mid;
  }
  return Math.abs(xs[lo] - x) <= Math.abs(xs[hi] - x) ? lo : hi;
}
