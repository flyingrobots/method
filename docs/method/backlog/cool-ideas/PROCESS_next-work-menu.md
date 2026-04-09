---
title: "Next Work Menu"
legend: PROCESS
lane: cool-ideas
owner: "METHOD maintainers"
priority: medium
acceptance_criteria:
  - "The note defines both a CLI and MCP surface for asking what to work on next."
  - "The proposed result is a bounded menu of recommendations with supporting stats, not a single imperative answer."
  - "The recommendation logic names the repo-truth inputs it may consider, including backlog lanes, backlog frontmatter, and BEARING."
  - "The contract distinguishes evidence-backed ranking signals from optional heuristic weighting so the surface stays inspectable."
---

# Next Work Menu

METHOD can describe current state through backlog lanes, frontmatter,
status output, and signposts like `BEARING`, but it still makes humans
and agents manually synthesize that data into "what should we work on
next?" every time. That synthesis is exactly the sort of bounded
coordination question the repo should be able to answer for itself.

The right answer is not a single authoritarian recommendation. It is a
small menu that says what looks strong, why it looks strong, what the
queue currently contains, and what evidence supported the ranking.

## Proposed Contract

- Surface:
  ship both `method next [--json] [--limit <n>]` and an MCP tool such
  as `method_next_work`. CLI default output is a short ranked menu for
  humans; `--json` and MCP return the same structured result object.
- Result goal:
  answer "what looks like the next sensible work items?" with a menu of
  candidates and supporting repo stats, not a single `do_this_now`
  directive.
- Bounded default:
  the default output should show a small menu such as the top `3`
  recommendations plus repo summary stats. `--limit` may widen the menu
  within a bounded maximum.

## Implementation Prerequisites

- Typed frontmatter dependency:
  the surface depends on typed frontmatter access for fields such as
  `acceptance_criteria`, `priority`, and `owner`. It should either wait
  for `PROCESS_typed-frontmatter-access` to land first or include the
  required typed-read support in the same implementation slice.
- Backlog item schema extension:
  the result shape assumes backlog items can expose `priority`, `owner`,
  and `has_acceptance_criteria` in addition to the current
  `BacklogItem` identity fields, so the slice must extend that schema or
  provide an equivalent typed query object.
- Backlog query reuse:
  `PROCESS_backlog-query-surface` is reusable but not mandatory. The
  next-work slice may either build on that shared query surface or ship
  equivalent backlog enumeration logic in the same bounded change.

## Repo-Truth Inputs

- Backlog lanes:
  inspect the actual files under `docs/method/backlog/` and respect the
  lane ordering and semantics already present in the repo, especially
  `up-next`, `asap`, `bad-code`, `inbox`, and `cool-ideas`.
- Backlog frontmatter:
  parse frontmatter such as `legend`, `lane`, `priority`, `owner`, and
  `acceptance_criteria` so the recommendations are grounded in declared
  metadata rather than filename heuristics alone.
- `BEARING`:
  treat [BEARING.md](../../../BEARING.md) as a
  directional signal, not an override. If `BEARING` names a current
  priority or describes repo discomfort, that should influence the menu
  and be cited as evidence when it materially changes ranking.
- Current status:
  incorporate repo-visible counts or conditions already surfaced by
  `method status`, such as whether `up-next` is empty, whether `asap`
  contains items, how many `bad-code` items remain, and whether an
  active cycle already exists.
- Optional future signals:
  design or retro recency, legend coverage gaps, or graveyard patterns
  may later become weighted inputs, but they are not required for the
  first slice.

## Output Shape

- Shared result fields:
  `generated_at`,
  `summary: { active_cycle_count, lane_counts, bearing_priority, bearing_concerns }`,
  `recommendations: Array<Recommendation>`,
  `selection_notes: string[]`.
- Recommendation shape:
  each recommendation includes at minimum
  `path`,
  `title`,
  `lane`,
  `priority`,
  `why_now: string[]`,
  `signals: Array<{ type: string, value: string | number | boolean, source: string }>`,
  and `score_band: "highest" | "strong" | "worth-considering"`.
- Score band rules:
  `score_band` is a relative ranking within the returned menu, not an
  absolute score. The menu MUST be sorted by score band in the order
  `highest`, `strong`, `worth-considering`, and then by lane precedence
  inside each band. Multiple recommendations may share a band. A typical
  menu gives the top `1-2` items `highest`, the next `2-3` items
  `strong`, and the rest `worth-considering`, but those bands remain
  relative to the current menu rather than fixed numeric thresholds.
- CLI rendering:
  print a short summary block first, then a numbered menu where each
  item shows the backlog file, lane, priority, and 2-4 concise `why
  now` bullets. Keep the tone advisory rather than imperative.

## Ranking Rules

- Deterministic first-pass ordering:
  when `BEARING` does not explicitly elevate another lane, lane
  precedence is `asap`, then `up-next`, then `bad-code`, then `inbox`,
  then `cool-ideas`. If a lane is empty, the next non-empty lane
  provides candidates. If `BEARING` materially changes that order, the
  output must cite the exact bearing evidence that justified the
  override.
- Evidence before heuristics:
  every recommendation must cite the concrete repo facts that pushed it
  upward, such as `lane=up-next`, `priority=medium`, `BEARING current
  priority mentions legend coverage`, or `bad-code count > 0`.
- No fake precision:
  avoid opaque numeric scoring that implies certainty the repo cannot
  support. If a score exists internally, the user-facing contract should
  expose it only as a coarse band plus explicit signals.
- Explainable divergence:
  if `BEARING` pushes a `cool-ideas` item above a `bad-code` item, the
  output must say so clearly instead of silently overriding lane order.

## Failure Modes

- Empty backlog:
  return an explicit empty-menu result with summary stats and a note
  that no candidate backlog items were found.
- Active cycle present:
  if a cycle is already open, the surface may still show the menu but
  must note that new pull decisions should usually wait until the active
  cycle is resolved.
- Missing or malformed frontmatter:
  do not crash; skip malformed items or include a warning note in
  `selection_notes`, depending on whether partial parsing is safe.

## Non-goals

- Auto-pull or auto-assign work from the returned menu.
- Replace human judgment about strategy or timing.
- Pretend the repo can infer a single objectively correct next task from
  incomplete signals.
