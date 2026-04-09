---
title: "Review State Query"
legend: "PROCESS"
cycle: "0034-review-state-query"
source_backlog: "docs/method/backlog/cool-ideas/PROCESS_review-state-query.md"
---

# Review State Query

Source backlog item: `docs/method/backlog/cool-ideas/PROCESS_review-state-query.md`
Legend: PROCESS

## Sponsors

- Human: Backlog operator
- Agent: Implementation agent

## Hill

Land a METHOD-native review-state surface that answers "what is under
review and is it merge-ready?" without forcing humans or agents to
reconstruct `gh` state ad hoc. The first cut must ship one shared
engine behind both CLI and MCP, with deterministic selector behavior,
structured blockers, and explicit handling for unresolved threads,
checks, sticky review decisions, and observable bot cooldowns.

## Playback Questions

### Human

- [ ] Can I run `method review-state` on the current branch or an
      explicit PR and get a bounded summary of blockers and
      merge-readiness?
- [ ] When no PR exists or multiple PRs match the branch, do I get a
      deterministic result instead of a vague shell failure?

### Agent

- [ ] Does the CLI `--json` output exactly match the MCP
      `structuredContent.result` contract?
- [ ] Do unresolved review threads remain the primary blockers when
      `reviewDecision` is still `CHANGES_REQUESTED`?
- [ ] Does the result surface explicit bot cooldown / review-in-progress
      states only when they are observable in GitHub data?

## Accessibility and Assistive Reading

- Linear truth / reduced-complexity posture:
  default CLI output must stay short, ordered, and label-driven so a
  human can scan it top-to-bottom without parsing raw JSON or nested
  GitHub state.
- Non-visual or alternate-reading expectations:
  JSON mode and MCP output must carry the full machine contract so
  screen-reader or agent callers do not lose fidelity compared with the
  prose summary.

## Localization and Directionality

- Locale / wording / formatting assumptions:
  the first cut is English-only and preserves GitHub enum vocabulary
  (`APPROVED`, `CHANGES_REQUESTED`, `REVIEW_REQUIRED`) rather than
  inventing localized labels.
- Logical direction / layout assumptions:
  output is plain left-to-right text / JSON with no layout-specific
  affordances.

## Agent Inspectability and Explainability

- What must be explicit and deterministic for agents:
  selector rules, result field presence, blocker types, and null/zero
  behavior for `no-pr` / `ambiguous-pr` cases must be fixed and tested.
- What must be attributable, evidenced, or governed:
  cooldown blockers must only appear when the latest observable bot
  signal actually contains a rate-limit message; the engine must not
  invent hidden policy state.

## Backlog Context

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
  this slice ships both a CLI command and an MCP tool:
  `method review-state [--pr <number>|--current-branch] [--json]` for
  humans and scripts, plus `method_review_state` for MCP callers. A
  generated signpost is out of scope for the initial slice; if a future
  signpost is added, it should be a follow-on item with its own bounded
  output contract rather than implied by this note.
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
- Output shape:
  CLI default output is a bounded human-readable summary; `--json`
  prints the same result object returned by the MCP tool under
  `structuredContent.result`. `method_review_state` must follow the
  existing MCP envelope shape:
  `structuredContent = { tool, ok, result }` on success and
  `structuredContent = { tool, ok: false, error.message }` on failure.
- Required `structuredContent.result` fields and types:
  `status: "ready" | "blocked" | "no-pr" | "ambiguous-pr"`;
  `pr_number: integer | null`;
  `pr_url: string | null`;
  `review_decision: "APPROVED" | "CHANGES_REQUESTED" | "REVIEW_REQUIRED" | "NONE"`;
  `unresolved_thread_count: integer`;
  `checks: { passing: Array<{ name: string, status: string, url: string | null }>, pending: Array<{ name: string, status: string, url: string | null }>, failing: Array<{ name: string, status: string, url: string | null }> }`;
  `bot_review_state: "none" | "pending" | "approved" | "changes_requested" | "commented"`;
  `approval_count: integer`;
  `changes_requested_count: integer`;
  `merge_ready: boolean`;
  `blockers: Array<{ type: "selection" | "review_decision" | "unresolved_threads" | "pending_checks" | "failing_checks" | "bot_review" | "policy_cooldown", message: string, source: string }>`.
  The result must include every field even in `no-pr` or
  `ambiguous-pr` cases; for `no-pr`, use `pr_number: null`,
  `pr_url: null`, `review_decision: "NONE"`,
  `unresolved_thread_count: 0`, empty check arrays,
  `bot_review_state: "none"`, `approval_count: 0`,
  `changes_requested_count: 0`, `merge_ready: false`, and a single
  `selection` blocker explaining the missing PR.
- Merge-ready rule:
  `merge_ready` is true only when required checks are green, unresolved
  review threads are zero, no required reviewer or bot still reports a
  blocking state, and no `policy_cooldown` blocker is active. For the
  initial slice, `policy_cooldown` means an explicitly observable forge
  review cooldown or rate-limit message, such as a CodeRabbit comment or
  check message saying review must be retried after a timestamp. Detect
  it from the latest bot review/comment/check text; if no such message
  is observable via API, do not invent a cooldown blocker.
- Blocker output:
  `blockers` is a canonical array of structured objects, not free-form
  strings. `type` comes from the fixed set above, while `message` is
  human-readable. Example blockers are illustrative messages inside that
  schema, for example
  `{ type: "bot_review", message: "CodeRabbit review in progress", source: "coderabbitai" }`,
  `{ type: "review_decision", message: "reviewDecision still CHANGES_REQUESTED", source: "github" }`,
  or
  `{ type: "unresolved_threads", message: "2 unresolved review threads", source: "github" }`.

## Non-goals

- Auto-merge a PR once the blockers list is empty.
- Replace human judgment about whether a change should merge.
