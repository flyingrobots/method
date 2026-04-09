---
title: "Review State Query"
legend: PROCESS
lane: cool-ideas
owner: "METHOD maintainers"
priority: medium
acceptance_criteria:
  - "The review-state surface reports CI/check status, unresolved review-thread count, review decision, and bot-review pending state for the active PR."
  - "The output includes a deterministic merge_ready boolean plus a blocker list naming exactly which states still prevent merge."
  - "Selector precedence is explicit: `method review-state` defaults to `--current-branch`, rejects `--pr` with `--current-branch`, and defines deterministic no-PR and ambiguous-PR outputs."
  - "Humans and agents can answer 'is this PR actually mergeable yet?' without manually reconstructing GitHub thread/check state."
---

# Review State Query

METHOD currently says review state is not part of the repo-native
coordination surface. A dedicated query or signpost that summarizes what
is under review, awaiting merge, or blocked in PR state would make the
system cheaper for both humans and agents who currently have to bounce
out to forge context to answer that simple question.

Recent PR review work showed the sharper version of this problem: a
branch can be technically clean while still being procedurally blocked
by pending bot review, stale `reviewDecision`, unresolved threads, or
checks that have not settled yet. That state is real coordination data,
but today it lives only in ad hoc `gh` inspection.

## Proposed Contract

- Surface:
  `method review-state [--pr <number>|--current-branch]` and/or a small
  generated signpost section.
- Selector rules:
  `--pr` and `--current-branch` are mutually exclusive. If neither flag
  is provided, `review-state` behaves as `--current-branch`. Passing
  both flags is invalid input and should exit non-zero with a clear
  error before any GitHub calls begin.
- Current-branch resolution:
  when `--current-branch` maps to exactly one PR, inspect that PR. When
  it maps to zero PRs, return a deterministic `status: no-pr` result
  with `pr_number: null`, `pr_url: null`, `merge_ready: false`, and a
  blocker such as `No PR found for current branch`. When it maps to
  multiple PRs, return `status: ambiguous-pr`, keep `pr_number` and
  `pr_url` null, set `merge_ready: false`, and include a blocker such as
  `Multiple PRs match current branch; rerun with --pr <number>`.
- Required fields:
  `status`, `pr_number`, `pr_url`, `review_decision`,
  `unresolved_thread_count`, `checks`, `bot_review_state`,
  `approval_count`, `changes_requested_count`, `merge_ready`, and
  `blockers`. The `review-state` output must include every field even in
  `no-pr` or `ambiguous-pr` cases; for `no-pr`, use
  `review_decision: none`, `unresolved_thread_count: 0`, `checks: []`,
  `bot_review_state: none`, `approval_count: 0`, and
  `changes_requested_count: 0`.
- Merge-ready rule:
  `merge_ready` is true only when required checks are green, unresolved
  review threads are zero, no required reviewer or bot still reports a
  blocking state, and no known cooldown/rate-limit rule is active.
- Blocker output:
  each blocker is named explicitly, for example `CodeRabbit review in
  progress`, `reviewDecision still CHANGES_REQUESTED`, or
  `2 unresolved review threads`.

## Non-goals

- [ ] Auto-merge a PR once the blockers list is empty.
- [ ] Replace human judgment about whether a change should merge.
