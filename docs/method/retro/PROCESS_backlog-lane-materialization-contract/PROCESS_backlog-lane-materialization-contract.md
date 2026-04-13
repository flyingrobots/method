---
title: "Backlog Lane Materialization Contract"
cycle: "PROCESS_backlog-lane-materialization-contract"
design_doc: "docs/design/PROCESS_backlog-lane-materialization-contract.md"
outcome: hill-met
drift_check: yes
---

# Backlog Lane Materialization Contract Retro

## Summary

Added `SCAFFOLD_LANES` as the single source of truth for lane
materialization. `init` now derives its lane directories from this
constant instead of hardcoding names. The contract docstring on
`SCAFFOLD_LANES` documents that individual lane dirs may be absent
when empty without making the workspace unhealthy.

## Playback Witness

Add artifacts under `docs/method/retro/PROCESS_backlog-lane-materialization-contract/witness` and link them here.

## Drift

- None recorded.

## New Debt

- None recorded.

## Cool Ideas

- None recorded.

## Backlog Maintenance

- [ ] Inbox processed
- [ ] Priorities reviewed
- [ ] Dead work buried or merged
