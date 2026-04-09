---
title: "Witness Drift Output Capture"
cycle: "0036-witness-drift-output-capture"
design_doc: "docs/design/0036-witness-drift-output-capture/witness-drift-output-capture.md"
outcome: hill-met
drift_check: yes
---

# Witness Drift Output Capture Retro

## Summary

This cycle fixed the witness path that was silently dropping drift
output. `captureWitness()` had been shelling out to `tsx src/cli.ts
drift <cycle>`, which fails in environments where `tsx` is not on PATH
and therefore collapses to an empty string through the existing exec
helper. The close-time witness then substituted the misleading fallback
`No drift output captured.` even though the repo had a real drift
report.

The fix is bounded: drift capture now records the direct
`detectDrift(cycle.name).output` string, while `npm test` capture stays
unchanged. The regression coverage proves both the visible outcome
(actual drift text lands in the witness) and the implementation choice
(drift capture no longer shells out through `tsx`).

## Playback Witness

- [Verification Witness](./witness/verification.md)

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
