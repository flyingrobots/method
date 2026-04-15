---
title: "GitHub Comment Sync Identity"
legend: "PROCESS"
cycle: "PROCESS_github-comment-sync-identity"
source_backlog: "docs/method/backlog/bad-code/PROCESS_github-comment-sync-identity.md"
---

# GitHub Comment Sync Identity

Source backlog item: `docs/method/backlog/bad-code/PROCESS_github-comment-sync-identity.md`
Legend: PROCESS

## Sponsors

- Human: Backlog operator
- Agent: Implementation agent

These labels are abstract roles. In this design, `user` means the served
perspective, like in a user story, not a literal named person or
specific agent instance.

## Hill

GitHub comment sync uses stable remote comment IDs instead of string
matching, so repeated pulls never duplicate already-synced comments and
new comments are correctly appended.

## Playback Questions

### Human

- [ ] `method sync github --pull` updates local backlog files with data from GitHub (labels, status, comments).

### Agent

- [ ] Does pull use stable comment IDs instead of string matching to avoid duplicating already-synced comments?

## Accessibility and Assistive Reading

- Linear truth / reduced-complexity posture: each synced comment is
  labeled with its stable GitHub comment ID in the output body.
- Non-visual or alternate-reading expectations: not in scope.

## Localization and Directionality

- Locale / wording / formatting assumptions: not in scope.
- Logical direction / layout assumptions: not in scope.

## Agent Inspectability and Explainability

- What must be explicit and deterministic for agents: synced comment
  IDs are stored in `github_synced_comment_ids` frontmatter so agents
  can inspect the sync state.
- What must be attributable, evidenced, or governed: each comment in
  the body includes its GitHub comment ID for traceability.

## Non-goals

- [ ] Edit reconciliation (updating the body of an existing synced comment).
- [ ] Two-way comment sync (pushing local comments to GitHub).
- [ ] Deleting locally synced comments when removed on GitHub.
