---
title: "Two-way GitHub Sync"
outcome: hill-met
drift_check: yes
---

# Two-way GitHub Sync Retro

Design: `docs/design/0021-two-way-github-sync/two-way-github-sync.md`
Outcome: hill-met
Drift check: yes

## Summary

This cycle delivered full two-way synchronization for the GitHub adapter.
The `GitHubAdapter` now supports both `push` (updating remote issues 
from local changes) and `pull` (updating local docs with remote labels, 
comments, and status). The `method sync github` command was enhanced 
with `--push` and `--pull` flags, and the MCP server now exposes a 
`method_sync_github` tool. This ensures the filesystem remains the 
authority while benefiting from the rich context of the GitHub forge.

## Playback Witness

- [Verification Witness](./witness/verification.md)

## Drift

- None recorded.

## New Debt

- Comment synchronization is additive-only and uses a simple string 
  check to avoid duplicates; it does not track individual comment IDs.

## Cool Ideas

- Support deleting local items if the remote issue is deleted.
- Sync GitHub milestones to backlog lanes or tags.

## Backlog Maintenance

- [x] Inbox processed
- [x] Priorities reviewed
- [x] Dead work buried or merged
