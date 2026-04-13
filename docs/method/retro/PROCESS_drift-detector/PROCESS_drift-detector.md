---
title: "Drift Detector"
outcome: hill-met
drift_check: yes
---

Design: `docs/design/0005-drift-detector/drift-detector.md`



## Summary

This cycle turned drift detection from backlog intent into a real
METHOD command. `method drift` now parses playback questions from active
cycle design docs, matches them against exact normalized test
descriptions, and reports unmatched questions with explicit file paths
and stable exit codes. The first cut is intentionally narrow and honest:
active cycles only, markdown/test parsing only, and no attempt to guess
semantic matches.

## Playback Witness

- [Witness Index](./witness/README.md)
- [Playback Witness](./witness/playback.md)
- [Verification Witness](./witness/verification.md)

## Drift

- None recorded.

## New Debt

- None recorded.

## Cool Ideas

- None recorded.

## Backlog Maintenance

- [x] Inbox processed
- [x] Priorities reviewed
- [x] Dead work buried or merged
- Promoted `SYNTH_generated-signpost-provenance` to `asap/`.
- Moved `PROCESS_behavior-spike-convention` and
  `SYNTH_executive-summary-protocol` to `up-next/`.
- Parked broader legend/provenance substrate work in `cool-ideas/`.
