---
title: "GitHub Comment Sync Identity"
cycle: "PROCESS_github-comment-sync-identity"
design_doc: "docs/design/PROCESS_github-comment-sync-identity.md"
outcome: hill-met
drift_check: yes
---

# GitHub Comment Sync Identity Retro

## Summary

Added stable GitHub comment ID tracking to the pull sync path.
Comment IDs from the API are stored in `github_synced_comment_ids`
frontmatter. Repeated pulls only append genuinely new comments.
Each synced comment is labeled with its GitHub ID in the body for
traceability.

## Playback Witness

Add artifacts under `docs/method/retro/PROCESS_github-comment-sync-identity/witness` and link them here.

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
