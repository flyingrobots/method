---
title: "Drift Threshold Config"
cycle: "PROCESS_drift-threshold-config"
design_doc: "docs/design/PROCESS_drift-threshold-config.md"
outcome: hill-met
drift_check: yes
---

# Drift Threshold Config Retro

## Summary

Added `drift_thresholds` to ConfigSchema with `semantic_match` (default
0.85) and `near_miss` (default 0.65). The drift detector reads these
from `.method.json` via the workspace config. Repos can now tune
matching tolerance without code changes.

## Playback Witness

Add artifacts under `docs/method/retro/PROCESS_drift-threshold-config/witness` and link them here.

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
