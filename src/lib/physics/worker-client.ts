// Browser-only wrapper around worker.ts. Call createPhysicsWorker from client
// code (for example inside a React effect), never on the server.

import type { SweepPoint, SweepTarget } from "./batch";
import type { SerializableWellConfig, ModelParams } from "./types";
import type { WorkerRequest, WorkerResponse } from "./worker";

type Job = WorkerRequest extends infer R ? (R extends { id: number } ? Omit<R, "id"> : never) : never;
type Success = Extract<WorkerResponse, { ok: true }>;

export interface PhysicsWorker {
  /** CSV of `count` random wells with full per-day results. */
  batchCsv(count: number, seed: number, params?: ModelParams): Promise<string>;
  /** One cycle per value, changing one input or one model parameter. */
  sweep(
    base: SerializableWellConfig,
    target: SweepTarget,
    values: number[],
    params?: ModelParams,
  ): Promise<SweepPoint[]>;
  terminate(): void;
}

export function createPhysicsWorker(): PhysicsWorker {
  const worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
  const pending = new Map<number, { resolve: (response: Success) => void; reject: (error: Error) => void }>();
  let nextId = 1;

  const rejectAll = (error: Error) => {
    for (const job of pending.values()) job.reject(error);
    pending.clear();
  };

  worker.addEventListener("message", (event: MessageEvent<WorkerResponse>) => {
    const response = event.data;
    const job = pending.get(response.id);
    if (!job) return;
    pending.delete(response.id);
    if (response.ok) job.resolve(response);
    else job.reject(new Error(response.error));
  });
  worker.addEventListener("error", (event) => {
    rejectAll(new Error(event.message || "The physics worker stopped."));
  });

  const post = (job: Job): Promise<Success> => {
    const id = nextId++;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      worker.postMessage({ ...job, id } as WorkerRequest);
    });
  };

  return {
    async batchCsv(count, seed, params) {
      const response = await post({ kind: "batchCsv", count, seed, params });
      if (response.kind !== "batchCsv") throw new Error("Unexpected worker response.");
      return response.csv;
    },
    async sweep(base, target, values, params) {
      const response = await post({ kind: "sweep", base, target, values, params });
      if (response.kind !== "sweep") throw new Error("Unexpected worker response.");
      return response.points;
    },
    terminate() {
      worker.terminate();
      rejectAll(new Error("The physics worker was stopped."));
    },
  };
}
