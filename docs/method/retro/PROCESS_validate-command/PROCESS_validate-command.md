---
title: "Validate Command"
cycle: "PROCESS_validate-command"
design_doc: "docs/design/PROCESS_validate-command.md"
outcome: hill-met
drift_check: yes
---

# Validate Command Retro

## Summary

Added `validateBacklogReadiness` to `pullItem`. Warns at pull time when
backlog items are missing `acceptance_criteria`, `priority`, or `legend`.
Warnings are returned in the Cycle result and surfaced by both CLI
(stderr) and MCP (structured content). Advisory only — does not block
the pull.

## Playback Witness

Add artifacts under `docs/method/retro/PROCESS_validate-command/witness` and link them here.

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
