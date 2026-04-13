---
title: "Generated Reference Sync Coupling"
legend: "PROCESS"
cycle: "0039-generated-reference-sync-coupling"
source_backlog: "docs/method/backlog/bad-code/PROCESS_generated-reference-sync-coupling.md"
---

# Generated Reference Sync Coupling

Source backlog item: `docs/method/backlog/bad-code/PROCESS_generated-reference-sync-coupling.md`
Legend: PROCESS

## Sponsors

- Human: Backlog operator
- Agent: Implementation agent

## Hill

TBD

## Playback Questions

### Human

- [ ] TBD

### Agent

- [ ] TBD

## Accessibility and Assistive Reading

- Linear truth / reduced-complexity posture: TBD
- Non-visual or alternate-reading expectations: TBD

## Localization and Directionality

- Locale / wording / formatting assumptions: TBD
- Logical direction / layout assumptions: TBD

## Agent Inspectability and Explainability

- What must be explicit and deterministic for agents: TBD
- What must be attributable, evidenced, or governed: TBD

## Non-goals

- [ ] TBD

## Backlog Context

Refreshing generated reference docs during PR work currently requires
running `method sync ship`, even when the only intended output is a file
like `docs/MCP.md` or `docs/CLI.md`. That full ship maneuver also
touches repo-level artifacts such as `docs/BEARING.md` and
`CHANGELOG.md`, which are explicitly supposed to reflect merged `main`
state rather than branch-local review work.

In practice, that means a small documentation regeneration step creates
unrelated branch noise that then has to be manually reverted. This is
the sort of coupling that wastes review time and makes agents less
confident about running the generator they actually need.

## Proposed Contract

- Current bad behavior:
  regenerating generated reference docs on a feature branch should not
  require mutating ship-only artifacts whose truth is tied to merged
  `main`.
- Desired split:
  keep `method sync ship` as the full post-merge ship maneuver, and add
  a dedicated branch-local reference-doc refresh surface such as
  `method sync refs`, backed by a TypeScript helper such as
  `generateReferenceDocs()`, for regenerating reference docs without
  mutating ship-only artifacts.
- Scoped outputs:
  `method sync refs` should refresh the current generated reference
  signposts exactly: `ARCHITECTURE.md`, `docs/CLI.md`, `docs/MCP.md`,
  and `docs/GUIDE.md`. It must not edit ship-only artifacts such as
  `docs/BEARING.md` or `CHANGELOG.md`.
- Safety:
  `method sync refs` MUST print the list of refreshed targets, and
  `generateReferenceDocs()` MUST return the same target list for MCP or
  other callers. That surfaced scope must name the exact refreshed
  targets (`ARCHITECTURE.md`, `docs/CLI.md`, `docs/MCP.md`,
  `docs/GUIDE.md`) and exclude ship-only files such as
  `docs/BEARING.md` and `CHANGELOG.md`.

## Non-goals

- Remove or weaken `method sync ship`.
- Make `BEARING` or `CHANGELOG` branch-local artifacts again.
- Solve every generated-document refresh problem in the same slice.
