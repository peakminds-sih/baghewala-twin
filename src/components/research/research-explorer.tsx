"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/kit/button";
import { Segmented } from "@/components/kit/segmented";
import { EQUATION_IDS } from "@/lib/physics";
import { TRANSITION } from "@/lib/motion";
import { GROUP_IDS, GROUPS, RELATIONSHIPS, RELATIONSHIP_BY_ID, type Relationship } from "@/lib/research/relationships";
import { EquationCard } from "./equation-card";
import { RelationshipMap } from "./relationship-map";
import { RelationshipPanel } from "./relationship-panel";
import { ResearchDataProvider } from "./research-data";
import { VariableTables } from "./variable-tables";

// The two views of the research page. The view and the chosen relationship
// live in the URL, so a link opens the same place. The URL is updated with
// history.replaceState, which Next.js supports without a navigation.

export type ResearchView = "one" | "all";

const VIEWS = [
  { value: "one", label: "One at a time" },
  { value: "all", label: "Everything" },
] as const;

function writeUrl(view: ResearchView, relId: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("view", view);
  if (view === "one") url.searchParams.set("rel", relId);
  else url.searchParams.delete("rel");
  window.history.replaceState(null, "", url);
}

/** The map nodes a relationship touches: its inputs, variables and equations. */
function highlightFor(r: Relationship): string[] {
  const ids: string[] = r.equations.map((id) => `eq${id}`);
  for (const term of r.terms) {
    if (term.kind === "time") ids.push("time");
    else if (term.kind !== "param") ids.push(term.key);
  }
  return ids;
}

// Next and previous slide 8 px in the direction of travel. With reduced
// motion on, MotionConfig drops the transform and keeps the fade.
const slide = {
  enter: (direction: number) => ({ opacity: 0, transform: `translateX(${direction * 8}px)` }),
  center: { opacity: 1, transform: "translateX(0px)" },
  exit: (direction: number) => ({ opacity: 0, transform: `translateX(${direction * -8}px)` }),
};

function OneView({ relId, onPick }: { relId: string; onPick: (id: string, direction: number) => void }) {
  const index = RELATIONSHIPS.findIndex((r) => r.id === relId);
  const relationship = RELATIONSHIPS[index];
  const [direction, setDirection] = useState(1);

  const go = (step: number) => {
    const next = (index + step + RELATIONSHIPS.length) % RELATIONSHIPS.length;
    setDirection(step);
    onPick(RELATIONSHIPS[next].id, step);
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-0 flex-1 basis-72 flex-col gap-1">
          <span className="text-caption text-ink-muted">Relationship</span>
          <select
            value={relId}
            onChange={(event) => {
              const next = RELATIONSHIPS.findIndex((r) => r.id === event.target.value);
              const step = next >= index ? 1 : -1;
              setDirection(step);
              onPick(event.target.value, step);
            }}
            className="h-9 w-full rounded-[4px] border border-hairline-strong bg-cream px-2 text-ui text-ink"
          >
            {GROUP_IDS.map((group) => (
              <optgroup key={group} label={GROUPS[group]}>
                {RELATIONSHIPS.filter((r) => r.group === group).map((r) => (
                  <option key={r.id} value={r.id}>
                    {`${r.from} → ${r.to}`.replace(/_/g, "")}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-2">
          <Button onClick={() => go(-1)} aria-label="Previous relationship">
            <ChevronLeft className="size-4" aria-hidden="true" />
            Previous
          </Button>
          <Button onClick={() => go(1)} aria-label="Next relationship">
            Next
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
          <span className="text-caption text-ink-muted tabular-nums" aria-live="polite">
            {index + 1} of {RELATIONSHIPS.length}
          </span>
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false} custom={direction}>
        <motion.div
          key={relationship.id}
          custom={direction}
          variants={slide}
          initial="enter"
          animate="center"
          exit="exit"
          transition={TRANSITION.base}
        >
          <RelationshipPanel relationship={relationship} mode="one" />
        </motion.div>
      </AnimatePresence>

      <section aria-labelledby="map-one-heading">
        <h2 id="map-one-heading" className="font-serif text-h4 font-medium text-green">
          Where this sits in the model
        </h2>
        <p className="mt-1 mb-3 max-w-[68ch] text-ui text-ink-muted">
          The parts this relationship touches stay lit. Hover or focus any node to see what it depends on and what depends on it.
        </p>
        <RelationshipMap highlight={highlightFor(relationship)} />
      </section>
    </div>
  );
}

function AllView() {
  const contents = [
    { href: "#map", label: "Map" },
    { href: "#equations", label: "Equations" },
    { href: "#variables", label: "Variables" },
    { href: "#relationships", label: "Relationships" },
  ];
  return (
    <div className="space-y-16">
      <nav aria-label="On this page" className="flex flex-wrap gap-x-6 gap-y-2 border-b border-hairline pb-4 text-ui">
        {contents.map((c) => (
          <a key={c.href} href={c.href} className="text-green underline-offset-4 hover:underline">
            {c.label}
          </a>
        ))}
      </nav>

      <section id="map" aria-labelledby="map-heading" className="scroll-mt-24">
        <h2 id="map-heading" className="font-serif text-h3 font-medium text-green sm:text-h2">
          How the variables connect
        </h2>
        <p className="mt-2 mb-4 max-w-[68ch] text-body text-ink">
          The physics runs one way, from the steam and pump settings on the left to the oil, the safe speed and the sensor signals on the
          right. Viscosity is the split point: one number sets both the oil rate and the rod safety. Hover or focus a node to trace it.
        </p>
        <RelationshipMap />
      </section>

      <section id="equations" aria-labelledby="equations-heading" className="scroll-mt-24">
        <h2 id="equations-heading" className="font-serif text-h3 font-medium text-green sm:text-h2">
          Equations
        </h2>
        <p className="mt-2 mb-4 max-w-[68ch] text-body text-ink">
          The eight equations of the technical reference. Each says whether it is physics or our assumption, and lists every constant it uses
          with its source.
        </p>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {EQUATION_IDS.map((id) => (
            <EquationCard key={id} id={id} />
          ))}
        </div>
      </section>

      <section id="variables" aria-labelledby="variables-heading" className="scroll-mt-24">
        <h2 id="variables-heading" className="mb-4 font-serif text-h3 font-medium text-green sm:text-h2">
          Variables
        </h2>
        <VariableTables />
      </section>

      <section id="relationships" aria-labelledby="relationships-heading" className="scroll-mt-24">
        <h2 id="relationships-heading" className="font-serif text-h3 font-medium text-green sm:text-h2">
          Relationships
        </h2>
        <p className="mt-2 max-w-[68ch] text-body text-ink">
          How each input moves each output. Every graph and number is computed from the model; the ones that need whole cycles run in the
          background.
        </p>
        <div className="mt-8 space-y-14">
          {RELATIONSHIPS.map((r) => (
            <div key={r.id} className="border-t border-hairline pt-8">
              <RelationshipPanel relationship={r} mode="all" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function ResearchExplorer({ initialView, initialRelId }: { initialView: ResearchView; initialRelId: string }) {
  const [view, setView] = useState<ResearchView>(initialView);
  const [relId, setRelId] = useState(RELATIONSHIP_BY_ID.has(initialRelId) ? initialRelId : RELATIONSHIPS[0].id);

  return (
    <ResearchDataProvider>
      <div className="mb-10 flex flex-wrap items-center gap-4">
        <Segmented
          label="View"
          options={VIEWS}
          value={view}
          onChange={(next) => {
            setView(next);
            writeUrl(next, relId);
          }}
        />
        <span className="text-caption text-ink-muted">
          {view === "one" ? "One relationship with its own graph." : "The map, every equation, every variable and every relationship."}
        </span>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={view} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={TRANSITION.base}>
          {view === "one" ? (
            <OneView
              relId={relId}
              onPick={(id) => {
                setRelId(id);
                writeUrl("one", id);
              }}
            />
          ) : (
            <AllView />
          )}
        </motion.div>
      </AnimatePresence>
    </ResearchDataProvider>
  );
}
