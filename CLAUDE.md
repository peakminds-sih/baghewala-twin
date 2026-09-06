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

This is a freshly bootstrapped `create-next-app` project with no application code yet — `src/app/page.tsx` is still the default template. Expect to be building features from scratch.

## Commands

- `npm run dev` — start the dev server (http://localhost:3000)
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run lint` — run ESLint

There is no test runner configured yet. If adding one, wire it into `package.json` scripts and document how to run a single test here.

## Stack & conventions

- **Next.js 16** (App Router) with **React 19** and **TypeScript** in `strict` mode.
- **Tailwind CSS v4** — configured entirely in CSS via `@import "tailwindcss"` and `@theme inline` in `src/app/globals.css`; there is no `tailwind.config.js`. Design tokens (`--background`, `--foreground`, fonts) live in `globals.css` and switch on `prefers-color-scheme`.
- Import alias: `@/*` maps to `src/*`.
- Fonts: Geist / Geist Mono loaded via `next/font/google` in `src/app/layout.tsx` and exposed as `--font-geist-sans` / `--font-geist-mono`.
- ESLint uses the flat-config `eslint-config-next` (`core-web-vitals` + `typescript`) in `eslint.config.mjs`.

All source lives under `src/app/`. Add routes as App Router folders there; shared code should go under `src/` (e.g. `src/lib`, `src/components`) to use the `@/` alias.

## Other agent configs

A Codex config exists at `~/.codex/config.toml`. To import its user-level items (MCP servers, slash commands, subagents, skills, instructions) into Claude Code, reply `/import` to see what's importable, then `/import --yes=<digest>` to apply.
