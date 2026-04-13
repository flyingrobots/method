---
title: "CI Hardening"
cycle: "PROCESS_ci-hardening"
design_doc: "docs/design/PROCESS_ci-hardening.md"
outcome: hill-met
drift_check: yes
---

# CI Hardening Retro

## Summary

Added Biome linter with recommended rules, `npm run lint` script,
pre-commit hook enforcing lint, pre-push hook enforcing tests. CI
workflow now runs audit, lint, build, test, and pack verification.
Zero lint violations on the current codebase.

## Playback Witness

Add artifacts under `docs/method/retro/PROCESS_ci-hardening/witness` and link them here.

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
