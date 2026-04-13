---
title: "CLI Module Split"
outcome: hill-met
drift_check: yes
---

Design: `docs/design/0007-cli-module-split/cli-module-split.md`



## Summary

This cycle split the CLI monolith into behavior-owned modules without
changing the command surface. `src/cli.ts` is now a thin 97-line entry
point that wires command execution together, while `src/cli-args.ts`,
`src/workspace.ts`, `src/drift.ts`, and `src/errors.ts` carry the
owned runtime behavior. This first cut moved argument parsing and
drift-specific behavior into dedicated modules while leaving
workspace-local document scaffolding inside `src/workspace.ts`. The
existing CLI contract stayed intact:
`npm test`, `npm run build`, and `npm run method -- status` all still
pass after the split.

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

- [x] Inbox processed during cycle closeout
- [x] Priorities reviewed
- [x] Dead work buried or merged
- Moved `PROCESS_retro-conversational-closeout` from `inbox/` to
  `cool-ideas/`.
- Left `SYNTH_generated-signpost-provenance` as the sole `asap/` item.
- Left `PROCESS_git-branch-workflow-policy`,
  `PROCESS_library-api-surface`, and
  `PROCESS_system-style-javascript-adoption` in `up-next/` for later
  cycle planning.
- Branch tip now also carries the later backlog capture
  `PROCESS_release-shaping-and-user-migration-docs` in `inbox/`.
