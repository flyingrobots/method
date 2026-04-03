# Release shaping and user migration docs Retro

Design: `docs/design/0008-release-shaping-and-user-migration-docs/release-shaping-and-user-migration-docs.md`
Outcome: hill-met
Drift check: yes

## Summary

This cycle made releases a first-class METHOD concern instead of a
light note hanging off `CHANGELOG.md`. The repo now distinguishes
between release doctrine in `docs/method/release.md`, a deterministic
execution layer in `docs/method/release-runbook.md`, internal release
packets under `docs/method/releases/`, and user-facing release notes
under `docs/releases/`.

The cycle also kept backlog topology honest: releases aggregate shipped
work, but they do not create version-numbered backlog lanes or move
backlog items by version. `method init` now scaffolds the new release
surfaces so fresh workspaces start with the same doctrine the repo now
claims.

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
- Pulled `PROCESS_release-shaping-and-user-migration-docs` from
  `inbox/` into this cycle.
- Left `SYNTH_generated-signpost-provenance` as the sole `asap/` item.
- Left `PROCESS_behavior-spike-convention`,
  `PROCESS_git-branch-workflow-policy`,
  `PROCESS_library-api-surface`, and
  `PROCESS_system-style-javascript-adoption` in `up-next/`.
