"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePhysicsWorker } from "@/hooks/use-physics-worker";
import type { SweepPoint, VariableKey } from "@/lib/physics";
import type { PhysicsWorker } from "@/lib/physics/worker-client";
import type { Outcome, Relationship, SweepJob } from "@/lib/research/relationships";
import { rangeJobs, summarizeRanges, type ValueRange } from "@/lib/research/variable-ranges";

// One physics worker for the whole research page. Sweeps run there, one after
// another, and each result is cached so a sweep that two graphs share runs
// once. The cache belongs to one worker: if the worker stops (for example on
// unmount), the next request starts a new worker with an empty cache.

type RunJobs = (jobs: SweepJob[]) => Promise<SweepPoint[][]>;

const ResearchDataContext = createContext<RunJobs | null>(null);

export function ResearchDataProvider({ children }: { children: React.ReactNode }) {
  const getWorker = usePhysicsWorker();
  const caches = useRef(new WeakMap<PhysicsWorker, Map<string, Promise<SweepPoint[]>>>());

  const run = useCallback<RunJobs>(
    (jobs) => {
      const worker = getWorker();
      let cache = caches.current.get(worker);
      if (!cache) {
        cache = new Map();
        caches.current.set(worker, cache);
      }
      const known = cache;
      return Promise.all(
        jobs.map((job) => {
          const key = JSON.stringify(job);
          let promise = known.get(key);
          if (!promise) {
            promise = worker.sweep(job.base, job.target, job.values, job.params);
            known.set(key, promise);
          }
          return promise;
        }),
      );
    },
    [getWorker],
  );

  return <ResearchDataContext.Provider value={run}>{children}</ResearchDataContext.Provider>;
}

function useRunJobs(): RunJobs {
  const run = useContext(ResearchDataContext);
  if (!run) throw new Error("Wrap research components in <ResearchDataProvider>.");
  return run;
}

type Loaded<T> = { key: string; value?: T; error?: string };

/** Runs sweep jobs in the worker and builds a value from the results. */
function useSweeps<T>(key: string, jobs: SweepJob[] | null, build: (results: SweepPoint[][]) => T) {
  const run = useRunJobs();
  const [state, setState] = useState<Loaded<T> | null>(null);

  useEffect(() => {
    if (!jobs) return;
    let alive = true;
    run(jobs)
      .then((results) => {
        if (alive) setState({ key, value: build(results) });
      })
      .catch((error: Error) => {
        if (alive) setState({ key, error: error.message });
      });
    return () => {
      alive = false;
    };
  }, [key, jobs, build, run]);

  const current = state?.key === key ? state : null;
  return { value: current?.value ?? null, error: current?.error ?? null };
}

const NO_BUILD = () => null;

/** The graph and facts for one relationship. Direct ones compute at once. */
export function useOutcome(relationship: Relationship): { outcome: Outcome | null; error: string | null } {
  const compute = relationship.compute;
  const direct = useMemo(() => (compute.kind === "direct" ? compute.run() : null), [compute]);
  const swept = useSweeps<Outcome | null>(
    relationship.id,
    compute.kind === "sweep" ? compute.jobs : null,
    compute.kind === "sweep" ? compute.build : NO_BUILD,
  );
  if (direct) return { outcome: direct, error: null };
  return { outcome: swept.value, error: swept.error };
}

const RANGE_JOBS = rangeJobs();

/** Min–max of each computed variable across the simulator inputs. */
export function useVariableRanges(): { ranges: Partial<Record<VariableKey, ValueRange>> | null; error: string | null } {
  const { value, error } = useSweeps("variable-ranges", RANGE_JOBS, summarizeRanges);
  return { ranges: value, error };
}
