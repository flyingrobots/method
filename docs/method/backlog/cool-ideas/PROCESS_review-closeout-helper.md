---
title: "Review Closeout Helper"
legend: PROCESS
lane: cool-ideas
owner: "METHOD maintainers"
priority: medium
acceptance_criteria:
  - "The note defines a bounded CLI and/or MCP surface for closing out a PR review round."
  - "The proposal distinguishes read-only inspection from write actions such as replying to comments or resolving threads."
  - "The output contract includes unresolved-thread inventory plus a machine-readable summary of which comments were addressed by which commit."
  - "The helper is explicitly scoped to review-round coordination and does not replace human judgment about whether a comment should be fixed, rebutted, or left open."
---

# Review Closeout Helper

PR review work in METHOD now has better visibility through review-state,
but the actual closeout maneuver is still mostly manual: inspect
unresolved threads, map fixes to comments, reply with SHA-backed notes,
resolve threads, and post a summary comment that explains what landed in
the round.

That workflow is repetitive enough that both humans and agents keep
reconstructing it from `gh` commands and handwritten checklists. The
repo has enough structure now to support a first-class helper for that
coordination move.

## Proposed Contract

- Surface:
  add a bounded helper such as
  `method review closeout [--pr <number>|--current-branch] [--json]`
  plus an MCP tool such as `method_review_closeout`.
- Read-first design:
  default behavior is read-only and returns a closeout plan or summary.
  Replying to comments, resolving threads, or posting a rollup comment
  should be explicit write actions, not hidden side effects of a read.
- Shared result:
  the structured result should include
  `pr_number`,
  `pr_url`,
  `unresolved_threads`,
  `addressed_threads`,
  `pending_threads`,
  and a `round_summary` array that maps thread or comment identifiers to
  an outcome like `fixed`, `explained`, `left-open`, or `not-applicable`.

## Coordination Features

- Thread inventory:
  enumerate unresolved review threads with path, line, author, and
  comment URL so a human or agent can see the review round as a bounded
  worklist.
- Commit mapping:
  allow a closeout summary to associate one or more commit SHAs with
  each addressed thread so the audit trail is not trapped in prose.
- Summary comment generation:
  generate a concise markdown table or bullet summary suitable for a PR
  comment, but keep actual posting as an explicit write step.
- Resolution staging:
  support a dry-run or staged mode that shows which threads would be
  replied to or resolved before any remote mutation happens.

## Relationship To Existing Work

- Distinct from review-state:
  `review-state` answers whether a PR is blocked or merge-ready.
  Closeout answers how to finish a review round and record what changed.
- Distinct from comment-sync identity:
  stable remote comment identity is still useful plumbing, but the
  closeout helper is a workflow surface rather than a low-level sync
  mechanism.

## Non-goals

- Auto-fix review comments without a human or agent deciding they are
  valid.
- Auto-merge the PR once all threads are resolved.
- Hide GitHub write actions behind a supposedly read-only command.
