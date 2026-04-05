---
title: "GitHub issue adapter"
legend: PROCESS
---

# GitHub issue adapter

Source backlog item: `docs/method/backlog/inbox/PROCESS_github-issue-adapter.md`
Legend: PROCESS

## Sponsors

- Human: Repository Operator
- Agent: System Automator

## Hill

Build a synchronization adapter that connects the filesystem BACKLOG to
GitHub Issues. The filesystem remains the authority; the adapter
ensures that backlog items have corresponding GitHub issues for
external visibility, storing the `github_issue_id` in the markdown
YAML frontmatter.

## Playback Questions

### Human

- [ ] A new `method sync github` command (or tool) identifies backlog
  items missing a GitHub issue and creates them.
- [ ] The created GitHub issue contains the title and body from the
  backlog markdown file.
- [ ] The markdown file is updated with the `github_issue_id` in its
  frontmatter.

### Agent

- [ ] `src/index.ts` (or a new module) provides a synchronization
  interface.
- [ ] `tests/github-adapter.test.ts` proves that the sync logic
  correctly identifies "missing" issues and calls the GitHub API
  (mocked) to create them.
- [ ] The sync logic correctly handles existing `github_issue_id` fields
  by skipping creation.

## Accessibility and Assistive Reading

- Linear truth / reduced-complexity posture: The adapter uses the
  existing linear markdown files as the source of truth. GitHub issues
  provide a secondary, web-accessible view of the same data.
- Non-visual or alternate-reading expectations: GitHub's web interface
  provides its own accessibility features for the synced data.

## Localization and Directionality

- Locale / wording / formatting assumptions: The adapter preserves the
  original markdown content.

## Agent Inspectability and Explainability

- What must be explicit and deterministic for agents: The mapping
  between filesystem paths and GitHub issue IDs must be explicit in the
  frontmatter.
- What must be attributable, evidenced, or governed: GitHub API calls
  should be logged or witnessed.

## Non-goals

- [ ] Two-way synchronization (GitHub as authority). Changes in GitHub
  comments or labels will not automatically sync back to the filesystem
  in this cycle.
- [ ] Synchronizing retros or design docs (only backlog items for now).

## Backlog Context

Build a GitHub issue adapter that synchronizes GitHub issues with the
filesystem BACKLOG (backlog is authority). The adapter should support
storing the GitHub issue ID in the YAML frontmatter of the markdown
documents.
