---
title: "Dist Output Pruning"
cycle: "PROCESS_dist-output-pruning"
design_doc: "docs/design/PROCESS_dist-output-pruning.md"
outcome: hill-met
drift_check: yes
---

# Dist Output Pruning Retro

## Summary

Added `rm -rf dist` before `tsc` in the build script so every build
starts clean. Two tests assert the script shape. No stale artifacts can
survive a build.

## Playback Witness

Add artifacts under `docs/method/retro/PROCESS_dist-output-pruning/witness` and link them here.

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
