---
title: "Library API Surface"
legend: PROCESS
---

# Library API Surface

Source backlog item: `docs/method/backlog/up-next/PROCESS_library-api-surface.md`
Legend: PROCESS

## Sponsors

- Human: @james
- Agent: @gemini-cli

## Hill

Extract a stable, programmable `Method` class or API surface from the
CLI monolith, enabling external tools and agents to interact with
METHOD workspaces without parsing terminal output.

## Playback Questions

### Human

- [ ] The `method` CLI continues to work exactly as before for all
  commands (`status`, `inbox`, `pull`, etc.).
- [ ] The codebase has a clear separation between domain logic
  (workspace operations) and presentation logic (CLI formatting).

### Agent

- [ ] A new `src/index.ts` (or similar) exports a `Method` class or
  functions that return structured data (not strings).
- [ ] `tests/api.test.ts` proves that a METHOD workspace can be
  initialized and queried via the new API without calling `runCli`.
- [ ] All existing `tests/cli.test.ts` pass, proving no regressions in
  the command-line adapter.

## Accessibility and Assistive Reading

- Linear truth / reduced-complexity posture: The API returns structured
  data (POJOs), allowing any consumer to choose their own presentation
  strategy (TUI, GUI, screen reader, etc.).
- Non-visual or alternate-reading expectations: Structured data is
  natively more accessible to non-visual consumers (like agents) than
  formatted terminal text.

## Localization and Directionality

- Locale / wording / formatting assumptions: The API returns domain
  objects, keeping localization concerns strictly in the presentation
  layer (CLI).
- Logical direction / layout assumptions: No layout assumptions are
  made by the API.

## Agent Inspectability and Explainability

- What must be explicit and deterministic for agents: API responses
  must be typed and deterministic.
- What must be attributable, evidenced, or governed: Operations that
  mutate the filesystem must return the resulting paths or artifacts.

## Non-goals

- [ ] Implementing the MCP server itself (that is a follow-up cycle).
- [ ] Changing the underlying filesystem schema.

## Backlog Context

`method` already ships a real CLI, but it does not yet expose a clean
runtime-owned library surface that other repos or agent wrappers can
consume directly.

What this surfaced:

- METHOD wants a `core` surface that returns structured results instead
  of terminal strings.
- The CLI should become a thin adapter over that core, not the only
  executable form of the system.
- A real API would make it possible to import METHOD in other repos, or
  wrap it with MCP, without shelling out and scraping human-oriented
  text.
- The boundary needs to be honest about what stays interactive
  operator-facing behavior and what becomes programmable runtime logic.
