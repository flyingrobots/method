---
title: "Ship Sync Automation"
outcome: hill-met
drift_check: yes
---

# Ship Sync Automation Retro

Design: `docs/design/0018-ship-sync-automation/ship-sync-automation.md`
Outcome: hill-met
Drift check: yes

## Summary

This cycle successfully automated the "Ship Sync Maneuver" through a new
`method sync ship` command. The command identifies closed cycles not 
yet present in `CHANGELOG.md`, appends them to the "Unreleased" section,
and completely refreshes `docs/BEARING.md` with the latest ships and 
backlog priorities. This reduces manual bookkeeping and ensures the 
repo's signposts stay honest as the system matures.

## Playback Witness

- [Verification Witness](./witness/verification.md)

## Drift

- None recorded.

## New Debt

- `renderBearing` currently uses a hardcoded template for the "What 
  feels wrong?" section; this could be moved to a configuration file or 
  extracted from the existing `BEARING.md` in a future cycle.

## Cool Ideas

- Add `method sync vision` to automate the Executive Summary Protocol.
- Support custom templates for signpost generation.

## Backlog Maintenance

- [x] Inbox processed
- [x] Priorities reviewed
- [x] Dead work buried or merged
