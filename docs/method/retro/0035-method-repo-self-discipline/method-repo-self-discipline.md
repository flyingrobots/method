---
title: "METHOD Repo Self Discipline"
cycle: "0035-method-repo-self-discipline"
design_doc: "docs/design/0035-method-repo-self-discipline/method-repo-self-discipline.md"
outcome: hill-met
drift_check: yes
---

# METHOD Repo Self Discipline Retro

## Summary

This cycle made the METHOD repo stop excusing its own bookkeeping
failures. The repo doctrine and release runbook now explicitly treat
"open cycle packet on `main`" as stop-and-repair work, the local MCP /
Claude config files and the one-off frontmatter backfill script are no
longer tracked repo artifacts, and a bounded legacy frontmatter repair
now recovers missing `title` metadata from the first Markdown heading on
read.

More importantly, this cleanup landed as a real cycle packet immediately
after closing the stale `0034` packet instead of being hidden inside
release-prep chatter. That is the behavior the repo should have modeled
all along.

## Playback Witness

- [Verification Witness](./witness/verification.md)

## Drift

- None recorded.

## Observed Debt

- `PROCESS_witness-drift-output-capture` remains open: the close-time
  verification witness still did not persist the explicit drift output,
  so this cycle re-observed the same already-tracked gap.

## Cool Ideas

- None recorded.

## Backlog Maintenance

- [x] Inbox processed
- [x] Priorities reviewed
- [x] Dead work buried or merged
