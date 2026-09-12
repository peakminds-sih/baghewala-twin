"use client";

import { useCallback, useEffect, useRef } from "react";
import { createPhysicsWorker, type PhysicsWorker } from "@/lib/physics/worker-client";

/**
 * Returns a function that gives this component's physics worker. The worker
 * starts on first use (for example the first export click), not on page
 * load, and stops when the component unmounts.
 */
export function usePhysicsWorker(): () => PhysicsWorker {
  const worker = useRef<PhysicsWorker | null>(null);

  useEffect(
    () => () => {
      worker.current?.terminate();
      worker.current = null;
    },
    [],
  );

  return useCallback(() => {
    worker.current ??= createPhysicsWorker();
    return worker.current;
  }, []);
}
