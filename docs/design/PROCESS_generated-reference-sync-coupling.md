---
title: "Generated Reference Sync Coupling"
legend: "PROCESS"
cycle: "PROCESS_generated-reference-sync-coupling"
source_backlog: "docs/method/backlog/bad-code/PROCESS_generated-reference-sync-coupling.md"
---

# Generated Reference Sync Coupling

Source backlog item: `docs/method/backlog/bad-code/PROCESS_generated-reference-sync-coupling.md`
Legend: PROCESS

## Sponsors

- Human: Backlog operator
- Agent: Implementation agent

These labels are abstract roles. In this design, `user` means the served
perspective, like in a user story, not a literal named person or
specific agent instance.

## Hill

Decouple branch-local reference-doc refresh from the full post-merge
ship sync, and flatten the design-doc layout so cycle naming scales for
concurrent users without sequential number collisions.

## Playback Questions

### Human

- [ ] Does `method sync refs` refresh only `ARCHITECTURE.md`, `docs/CLI.md`, `docs/MCP.md`, and `docs/GUIDE.md` without mutating `CHANGELOG.md` or `docs/BEARING.md`?
- [ ] Does `method pull` create a flat design doc at `docs/design/<LEGEND>_<slug>.md` instead of a nested directory?
- [ ] Does `method doctor` detect legacy nested design doc directories and offer to flatten them?

### Agent

- [ ] Does `generateReferenceDocs()` return the same target list that the CLI prints?
- [ ] Does `method_sync_refs` return structured content with the refreshed targets?
- [ ] Does `readCycleFromDoc()` discover both flat and legacy nested design docs?
- [ ] Does `method_doctor` report `legacy-design-layout` warnings with `flatten-design-doc` repair hints?

## Accessibility and Assistive Reading

- Linear truth / reduced-complexity posture: `method sync refs` prints
  the exact list of refreshed targets so the operator can read scope
  top-to-bottom. Doctor issues list legacy dirs with concrete fix
  instructions.
- Non-visual or alternate-reading expectations: all outputs are
  text-based lists; no color or layout cues are required.

## Localization and Directionality

- Locale / wording / formatting assumptions: English-only, ASCII paths.
- Logical direction / layout assumptions: left-to-right, no
  bidirectional layout dependencies.

## Agent Inspectability and Explainability

- What must be explicit and deterministic for agents: `syncRefs()`
  returns `{ targets, updated }` so agents know exactly which files
  changed. `readCycleFromDoc()` is deterministic across flat and legacy
  layouts.
- What must be attributable, evidenced, or governed: doctor repair hints
  carry `kind` and `targetPath` so agents can plan or apply repairs
  programmatically.

## Non-goals

- [ ] Remove or weaken `method sync ship`.
- [ ] Make `BEARING` or `CHANGELOG` branch-local artifacts again.
- [ ] Migrate existing legacy design doc directories in this PR.
- [ ] Solve every generated-document refresh problem in the same slice.

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

Additionally, the directory-per-cycle design doc layout
(`docs/design/<NNNN>-<slug>/<slug>.md`) uses sequential numeric
prefixes that collide when multiple operators work concurrently. The
flat layout (`docs/design/<LEGEND>_<slug>.md`) with legend-prefixed
cycle names eliminates both the unnecessary nesting and the numbering
bottleneck.
