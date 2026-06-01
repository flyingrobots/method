---
title: "Make GitHub Issues The Method Work Tracker"
cycle: "PROCESS_make-github-issues-the-method-work-tracker"
design_doc: "docs/design/PROCESS_make-github-issues-the-method-work-tracker.md"
github_issue_url: "https://github.com/flyingrobots/method/issues/27"
outcome: hill-met
drift_check: yes
---

# Make GitHub Issues The Method Work Tracker Retro

## Summary

GitHub Issues are now the Method repo's live work tracker. Repository
files remain the evidence ledger for design docs, witnesses, playbacks,
retros, release notes, and durable process artifacts.

This cycle added the canonical Method issue label taxonomy, issue
templates, PR template, GitHub-first workflow doctrine, migration
tooling, migrated-backlog archive, and tests around the migration
surface. Follow-up review hardened the migration command so invalid
lanes, ambiguous frontmatter, duplicate source markers, malformed issue
creation output, and incomplete label enumeration fail closed.

## Playback Witness

- Verification artifact:
  `docs/method/retro/PROCESS_make-github-issues-the-method-work-tracker/witness/verification.md`
- Human playback: the maintainer directed the transition to GitHub
  Issues, approved the Method pilot, and requested final closeout before
  wrapping the PR.
- Agent playback: docs, templates, migration tooling, tests, and PR
  review evidence demonstrate that issue labels are the live tracking
  surface while repo files remain Method evidence.

## Drift

- Review found a process drift issue: the PR had entered review before
  the cycle packet had a retro and witness. This retro and its witness
  repair that drift before merge.
- Review found migration-safety drift around legacy lanes and parser
  edge cases. The script now maps legacy `up-next` cards to
  `lane:asap`, rejects unknown lanes, requires exact frontmatter
  delimiters, guards `gh issue create` parsing, and loads labels through
  paginated GitHub API enumeration.

## New Debt

- Echo backlog migration remains a separate follow-up cycle.
- Legacy filesystem backlog commands remain compatibility and migration
  surfaces until future cycles retire or adapt them.
- GitHub Projects are intentionally out of scope for this cycle.

## Cool Ideas

- Add a future release gate that refuses to merge Method PRs whose
  design packet has unchecked playback questions or no retro witness.

## Backlog Maintenance

- [x] Inbox processed
- [x] Priorities reviewed
- [x] Dead work buried or merged
