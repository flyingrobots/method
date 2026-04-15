---
title: "Workspace Operation Split"
cycle: "PROCESS_workspace-operation-split"
design_doc: "docs/design/PROCESS_workspace-operation-split.md"
outcome: hill-met
drift_check: yes
---

# Workspace Operation Split Retro

## Summary

Extracted cycle path resolution (~215 lines) into `src/cycle-ops.ts`
and shared utilities (~60 lines) into `src/workspace-utils.ts`.
Reduced `src/index.ts` from ~2207 to ~1975 lines. Workspace class
remains the public facade; all extracted functions are named exports.
Further extraction (backlog ops, ship ops) is possible in follow-up
cycles.

## Playback Witness

Add artifacts under `docs/method/retro/PROCESS_workspace-operation-split/witness` and link them here.

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
