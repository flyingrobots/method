---
title: "Git branch workflow policy"
outcome: hill-met
drift_check: yes
---

# Git branch workflow policy Retro

Design: `docs/design/0015-git-branch-workflow-policy/git-branch-workflow-policy.md`
Outcome: hill-met
Drift check: yes

## Summary

This cycle formalized the Git branch and workflow policy for METHOD. The
policy defines clear naming conventions for cycle and maintenance
branches and introduces the "Ship Sync Maneuver" to ensure that
repo-level signposts like `BEARING.md` and `CHANGELOG.md` stay updated
after a merge to `main`. This doctrine provides the necessary rules for
both humans and agents to coordinate flawlessly in a distributed
environment.

## Playback Witness

- [Verification Witness](./witness/verification.md)

## Drift

- None recorded.

## New Debt

- None recorded.

## Cool Ideas

- Automate the "Ship Sync" maneuver via a CLI command.

## Backlog Maintenance

- [x] Inbox processed
- [x] Priorities reviewed
- [x] Dead work buried or merged
