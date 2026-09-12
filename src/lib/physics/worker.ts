// Web Worker entry. It runs the heavy jobs off the main thread: the batch CSV
// export and parameter sweeps. One cycle takes well under a millisecond, so
// the simulator runs single cycles on the main thread.
//
// Start it through worker-client.ts, not directly.

import { batchCsv, sweep } from "./batch";
import type { SweepPoint, SweepTarget } from "./batch";
import type { SerializableWellConfig, ModelParams } from "./types";

export type WorkerRequest =
  | { id: number; kind: "batchCsv"; count: number; seed: number; params?: ModelParams }
  | {
      id: number;
      kind: "sweep";
      base: SerializableWellConfig;
      target: SweepTarget;
      values: number[];
      params?: ModelParams;
    };

export type WorkerResponse =
  | { id: number; ok: true; kind: "batchCsv"; csv: string }
  | { id: number; ok: true; kind: "sweep"; points: SweepPoint[] }
  | { id: number; ok: false; error: string };

function handle(request: WorkerRequest): WorkerResponse {
  switch (request.kind) {
    case "batchCsv":
      return { id: request.id, ok: true, kind: "batchCsv", csv: batchCsv(request.count, request.seed, request.params) };
    case "sweep":
      return {
        id: request.id,
        ok: true,
        kind: "sweep",
        points: sweep(request.base, request.target, request.values, request.params),
      };
  }
}

self.addEventListener("message", (event: MessageEvent<WorkerRequest>) => {
  let response: WorkerResponse;
  try {
    response = handle(event.data);
  } catch (error) {
    response = {
      id: event.data.id,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
  self.postMessage(response);
});
