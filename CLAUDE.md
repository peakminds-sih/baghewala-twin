# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Project Rules

Before making assumptions about tools, libraries, or techniques, run a web
search first. Do not rely on training data for anything version-specific
or that may have changed.

## Rules

- Do not write or run unnecessary tests. Only test what's actually being changed.
- Deploy parallel subagents whenever a task splits into independent pieces.
- Keep subagents scoped and efficient — no subagent should duplicate work
  another is already doing.
- Assign the right model to the right subagent: simple/mechanical work to
  a lighter model, architecture and judgment calls to a stronger one.
- Never use workarounds or hacks to route around a library's intended usage.
  Prefer official documentation over Stack Overflow patterns or guesses.
- Write and explain things in simple, direct language — short sentences,
  common words, one idea per sentence. Follow ASD-STE100 (Simplified
  Technical English) conventions and William Zinsser's principles of
  cutting clutter from "On Writing Well."
- Maintain an in-built todo list at all times and keep it updated as work
  progresses.

## Status

The site has a landing page, `/documents`, `/team`, `/simulator` and `/research`.

- The documents in `public/documents/` are the specification. The technical reference, field guide and variable-relationships PDFs are rendered from HTML sources in `docs/`. `research.pdf` is a teammate's work: never rewrite it; corrections go on a dated errata page (`docs/research-errata.html`).
- `src/lib/physics/` is the only source of physics and of every model number (pure TypeScript, no React, no dependencies). Pages import from it; never retype a constant. Heavy jobs (batch CSV, sweeps) run in its Web Worker through `src/hooks/use-physics-worker.ts`.
- `DESIGN.md` is the design system. Tokens live in `src/app/globals.css`; shared UI is in `src/components/kit/` and `src/components/charts/`; motion tokens in `src/lib/motion.ts`.

## Commands

- `npm run dev` — start the dev server (http://localhost:3000)
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run lint` — run ESLint
- `npm run verify:physics` — checks the physics module against the worked numbers in the documents and prints actual against expected. Exit code 1 on any mismatch. Never change an expected value to make a check pass; report the mismatch.
- `npm run docs:pdf` — renders every `docs/*.html` source to PDF with the installed Chrome or Edge. `npm run docs:pdf -- technical-reference` renders one.

There is no unit-test runner. `verify:physics` is the only check, and it covers the physics functions only.

## Stack & conventions

- **Next.js 16** (App Router) with **React 19** and **TypeScript** in `strict` mode.
- **Tailwind CSS v4** — configured entirely in CSS via `@import "tailwindcss"` and `@theme` in `src/app/globals.css`; there is no `tailwind.config.js`. Light tokens sit on `:root`, dark tokens on `.dark`. A script in `layout.tsx` sets `.dark` on `<html>` from the stored choice or the system setting.
- `cn` (from `src/lib/utils.ts`) knows the custom type scale (`text-h1`, `text-ui`, `text-readout` …). Add any new size there, or `cn` drops it when a colour class follows.
- Import alias: `@/*` maps to `src/*`.
- Fonts: Inter, Source Serif 4 and Geist Mono via `next/font/google` in `src/app/layout.tsx`, exposed as `--font-inter`, `--font-source-serif` and `--font-geist-mono`.
- Motion: the `motion` package (`motion/react`), wrapped in `MotionConfig reducedMotion="user"`.
- ESLint uses the flat-config `eslint-config-next` (`core-web-vitals` + `typescript`) in `eslint.config.mjs`.

All source lives under `src/app/`. Add routes as App Router folders there; shared code should go under `src/` (e.g. `src/lib`, `src/components`) to use the `@/` alias.

## Other agent configs

A Codex config exists at `~/.codex/config.toml`. To import its user-level items (MCP servers, slash commands, subagents, skills, instructions) into Claude Code, reply `/import` to see what's importable, then `/import --yes=<digest>` to apply.
