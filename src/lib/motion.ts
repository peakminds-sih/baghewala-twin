// Motion tokens (DESIGN.md §7). Every animated component imports from here.
// CSS transitions use the same curves as --ease-out and --ease-in-out in
// globals.css; keep the two in step.

/** Entering, settling, and the default. */
export const EASE_OUT = [0.23, 1, 0.32, 1] as const;
/** Something moving from one place to another on screen. */
export const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const;

/** Seconds. */
export const DURATION = {
  instant: 0.1, // press feedback, hover colour
  quick: 0.16, // tooltips, highlights
  base: 0.24, // segment indicator, view change, marker jump, state fill
  draw: 0.9, // first draw of a chart line, once per page load
} as const;

/** Segment indicator and small layout changes. No visible overshoot. */
export const SPRING_UI = { type: "spring", visualDuration: DURATION.base, bounce: 0.1 } as const;

export const TRANSITION = {
  quick: { duration: DURATION.quick, ease: EASE_OUT },
  base: { duration: DURATION.base, ease: EASE_OUT },
  move: { duration: DURATION.base, ease: EASE_IN_OUT },
  draw: { duration: DURATION.draw, ease: EASE_OUT },
} as const;
