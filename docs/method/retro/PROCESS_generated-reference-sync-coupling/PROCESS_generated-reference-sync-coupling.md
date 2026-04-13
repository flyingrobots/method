---
title: "Generated Reference Sync Coupling"
cycle: "PROCESS_generated-reference-sync-coupling"
design_doc: "docs/design/PROCESS_generated-reference-sync-coupling.md"
outcome: hill-met
drift_check: yes
---

# Generated Reference Sync Coupling Retro

## Summary

Two coupled problems solved in one cycle:

1. **Reference doc decoupling**: `method sync refs` and `Workspace.syncRefs()`
   now refresh `ARCHITECTURE.md`, `docs/CLI.md`, `docs/MCP.md`, and
   `docs/GUIDE.md` without touching ship-only artifacts (`CHANGELOG.md`,
   `docs/BEARING.md`). Exposed via CLI, MCP (`method_sync_refs`), and
   integrated into `shipSync()`.

2. **Flat design docs with legend-prefixed cycle names**: Design docs are
   now flat files (`docs/design/<LEGEND>_<slug>.md`) instead of
   directory-per-cycle (`docs/design/<NNNN>-<slug>/<slug>.md`). Sequential
   numeric prefixes replaced with legend-prefixed slugs. Doctor detects
   legacy nested dirs and offers `flatten-design-doc` repair. Retros keep
   directory layout for witness subdirs. Legacy layout remains
   discoverable for backward compat.

## Playback Witness

- [Automated verification witness](witness/verification.md)

## Drift

- None recorded. All 7 playback questions matched.

## New Debt

- 39 existing design doc directories in this repo are still in legacy
  nested format. `method doctor` detects them; `method doctor --repair`
  can flatten them.

## Cool Ideas

- None recorded.

## Backlog Maintenance

- [x] Inbox processed
- [x] Priorities reviewed
- [ ] Dead work buried or merged
