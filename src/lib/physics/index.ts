// Physics module for the Baghewala digital twin. Pure TypeScript: no React,
// no dependencies. It runs in the browser, in a Web Worker and in Node.
//
// The chain (technical reference, section 4):
//   steam volume, quality     -> heated zone Vh, rh        (eq 1, heat.ts)
//   rh                        -> cooling constant τ, T(t)  (eq 2, temperature.ts)
//   T                         -> viscosity μ               (eq 3, viscosity.ts)
//   μ, rh, pump               -> oil rate q                (eq 4, inflow.ts)
//   μ, stroke                 -> safe pump speed Nmax      (eq 5, rod.ts)
//   phases                    -> day-by-day cycle          (eq 7, cycle.ts)
//   q, T, μ, pump             -> wellhead T, pump load     (eq 8, wellhead.ts, rod.ts)
//
// The Web Worker client is not exported here, because it only works in the
// browser. Import it from "@/lib/physics/worker-client".

export * from "./types";
export * from "./parameters";
export * from "./heat";
export * from "./temperature";
export * from "./viscosity";
export * from "./inflow";
export * from "./rod";
export * from "./wellhead";
export * from "./cycle";
export * from "./batch";
export * from "./equations";
