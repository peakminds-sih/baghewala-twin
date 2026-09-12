"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/kit/button";
import { Panel } from "@/components/kit/panel";
import { usePhysicsWorker } from "@/hooks/use-physics-worker";
import { downloadText } from "@/lib/download";

// Exports 30 random wells with full per-day results. The work runs in the
// physics Web Worker, so the page stays responsive.

const WELLS = 30;

type ExportState =
  | { kind: "idle" }
  | { kind: "working" }
  | { kind: "done"; seed: number }
  | { kind: "error"; message: string };

export function ExportPanel() {
  const getWorker = usePhysicsWorker();
  const [state, setState] = useState<ExportState>({ kind: "idle" });

  const onExport = async () => {
    const seed = crypto.getRandomValues(new Uint32Array(1))[0];
    setState({ kind: "working" });
    try {
      const csv = await getWorker().batchCsv(WELLS, seed);
      downloadText(`baghewala-wells-seed-${seed}.csv`, csv);
      setState({ kind: "done", seed });
    } catch (error) {
      setState({ kind: "error", message: error instanceof Error ? error.message : String(error) });
    }
  };

  return (
    <Panel title="Export wells">
      <p className="text-ui text-ink-muted">
        {WELLS} wells with random inputs from the ranges above. One row per well per day, with measured_* and
        inferred_* columns kept apart for model training. A third of the wells ignore the safe-speed limit, which
        produces rod-float failures.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button variant="primary" onClick={onExport} disabled={state.kind === "working"}>
          <Download className="size-4" aria-hidden="true" />
          Export {WELLS} wells (CSV)
        </Button>
        <p className="text-caption text-ink-muted" aria-live="polite">
          {state.kind === "working" ? "Working…" : null}
          {state.kind === "done" ? `Saved. Seed ${state.seed}; the same seed gives the same wells.` : null}
          {state.kind === "error" ? <span className="text-gold-text">Export failed: {state.message}</span> : null}
        </p>
      </div>
    </Panel>
  );
}
