"use client";

import { MotionConfig } from "motion/react";

// With reduced motion on, Motion skips transform and layout animation and
// keeps opacity and colour changes (DESIGN.md §7.4).
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
