---
title: "GitHub issue adapter"
outcome: hill-met
drift_check: yes
---

# GitHub issue adapter Retro

Design: `docs/design/0014-github-issue-adapter/github-issue-adapter.md`
Outcome: hill-met
Drift check: yes

## Summary

This cycle delivered a GitHub Issues synchronization adapter for the
METHOD backlog. The adapter identifies backlog items missing a
corresponding GitHub issue, creates them via the GitHub API, and
persists the issue ID and URL in the markdown YAML frontmatter. The
filesystem remains the source of truth for the backlog.

## Playback Witness

- [Verification Witness](./witness/verification.md)

## Drift

- None recorded.

## New Debt

- Environment variable handling for `GITHUB_TOKEN` and `GITHUB_REPO` is
  currently basic; could be moved to a configuration file in the future.

## Cool Ideas

- Two-way synchronization (comments, labels).
- Closing GitHub issues when a cycle is closed in METHOD.

## Backlog Maintenance

- [x] Inbox processed
- [x] Priorities reviewed
- [x] Dead work buried or merged
