---
title: "Behavior Spike Convention"
outcome: hill-met
drift_check: yes
---

# Behavior Spike Convention Retro

Design: `docs/design/0017-behavior-spike-convention/behavior-spike-convention.md`
Outcome: hill-met
Drift check: yes

## Summary

This cycle formalized the "Behavior Spike" convention in METHOD. We added
a new section to the process doc defining the 4-phase lifecycle for
temporary implementations: Capture, Execute, Witness, and Retire. This
doctrine ensures that "failing fast" or "buying clarity" is an honest,
documented part of the repo's history rather than a silent graveyard move.

## Playback Witness

- [Verification Witness](./witness/verification.md)

## Drift

- None recorded.

## New Debt

- None recorded.

## Cool Ideas

- Add a `method spike` command to automate the creation of `SPIKE_`
  prefixed backlog items.

## Backlog Maintenance

- [x] Inbox processed
- [x] Priorities reviewed
- [x] Dead work buried or merged
