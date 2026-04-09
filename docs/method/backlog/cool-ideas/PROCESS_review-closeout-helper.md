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
- Write surface:
  write behavior must stay explicit. The CLI should require named write
  actions such as `--reply`, `--resolve`, and `--post-summary`, plus an
  overall `--apply` switch. MCP should expose the same mutations as
  explicit action fields rather than implicit side effects of a read.
- Write semantics:
  write actions operate per thread in declared order, with summary
  comment posting last after reply or resolve work succeeds. CLI write
  mode must support `--dry-run` and require confirmation through
  `--yes` before mutating GitHub state. Exit codes should distinguish
  success or no-op (`0`), partial write failure (`2`), validation or
  mapping error (`3`), and remote auth or permission failure (`4`).
- Idempotency:
  retrying a closeout should be safe. Re-resolving an already resolved
  thread or reusing an existing SHA-backed reply should be treated as a
  no-op, and duplicate rollup comments should require explicit operator
  confirmation rather than being posted silently.
- Shared result:
  the structured result should include
  `pr_number`,
  `pr_url`,
  `unresolved_threads`,
  `addressed_threads`,
  `pending_threads`,
  and a `round_summary` array that maps thread or comment identifiers to
  an outcome like `fixed`, `explained`, `left-open`, or `not-applicable`.
- Outcome rules:
  `round_summary[*].outcome` should be determined by explicit operator
  input first, then by helper inference if the operator did not set it.
  `fixed` requires at least one mapped commit SHA and target comment or
  thread id, `explained` requires a posted explanation or prepared reply,
  `left-open` means the thread remains unresolved or was intentionally
  deferred, and `not-applicable` requires a short rationale. Each
  summary entry should record actor, timestamp, and confidence so later
  automation can audit how the outcome was chosen.

## Coordination Features

- Thread inventory:
  enumerate unresolved review threads with path, line, author, and
  comment URL so a human or agent can see the review round as a bounded
  worklist.
- Commit mapping:
  use explicit mapping supplied by the operator or agent, not silent
  heuristic guessing, to associate one or more commit SHAs with each
  addressed thread in the closeout summary. Read mode may suggest
  possible mappings, but write mode should only post mappings that were
  explicitly confirmed. When no confident mapping exists, the thread
  remains unmapped and stays in the pending set instead of inventing a
  commit relationship.
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
