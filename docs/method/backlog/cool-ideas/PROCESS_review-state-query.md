---
title: "Review State Query"
legend: PROCESS
lane: cool-ideas
owner: "METHOD maintainers"
priority: medium
acceptance_criteria:
  - "The review-state surface reports CI/check status, unresolved review-thread count, review decision, and bot-review pending state for the active PR."
  - "The output includes a deterministic merge_ready boolean plus a blocker list naming exactly which states still prevent merge."
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
- Required fields:
  PR number and URL, review decision, unresolved-thread count, failing
  or pending checks, pending bot-review state, approval/change-request
  counts, `merge_ready`, and `blockers`.
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
