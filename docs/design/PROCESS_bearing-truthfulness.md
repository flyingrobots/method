---
title: "BEARING Truthfulness"
legend: PROCESS
cycle: "PROCESS_bearing-truthfulness"
source_backlog: "docs/method/backlog/asap/PROCESS_bearing-truthfulness.md"
---

# BEARING Truthfulness

Source backlog item: `docs/method/backlog/asap/PROCESS_bearing-truthfulness.md`
Legend: PROCESS

## Sponsors

- Human: Repo signpost reader
- Agent: Signpost-trust consumer

## Hill

`renderBearing` stops emitting stale assertions and only reports claims
that are either directly derived from current repo state or tightly
bounded fallback text. The generated signpost should be safe to trust as
a summary surface, even when the underlying backlog or witness posture
changes.

## Playback Questions

### Human

- [ ] Does generated `BEARING.md` stop claiming witness generation is not
      automated?
- [ ] When backlog pressure changes, does `BEARING.md` describe concrete
      live repo state instead of hardcoded stale complaints?

### Agent

- [ ] Can I point to the exact backlog counts that caused each `What
      feels wrong?` line?
- [ ] Does `renderBearing` only emit derived or tightly bounded
      statements instead of unaudited repo assertions?

## Accessibility and Assistive Reading

- Linear truth / reduced-complexity posture: the signpost should stay
  short, but every complaint line must map back to explicit repo state.
- Non-visual or alternate-reading expectations: readers should be able
  to inspect BEARING linearly without wondering whether a sentence is
  aspirational prose or live repo truth.

## Localization and Directionality

- Locale / wording / formatting assumptions: counts and derived status
  should not rely on ambiguous rhetorical phrasing.
- Logical direction / layout assumptions: none; the problem is content
  truth, not layout.

## Agent Inspectability and Explainability

- What must be explicit and deterministic for agents: which backlog and
  cycle counts feed BEARING, and what fallback text appears when there is
  no active pressure to report.
- What must be attributable, evidenced, or governed: tests should prove
  the stale witness claim is gone and that "What feels wrong?" lines map
  to current backlog counts instead of hardcoded guesses.

## Non-goals

- [ ] Run ship sync on `main` from this branch; merged signpost refresh is
      still a post-merge maneuver.
- [ ] Make BEARING a full dashboard or replace `method status`.
- [ ] Solve unrelated signpost or legend taxonomy drift.

## Backlog Context

`renderBearing` currently emits factual claims that have drifted from the
repo. In particular, it still says witness generation is not automated
even though automated witness capture already landed. A generated
signpost that tells the truth incorrectly is worse than missing
automation: it creates confident drift in the repo's own public surface.

This needs a pass to make BEARING generation derive more of its claims
from current repo state or explicitly constrain which statements are
allowed to be hardcoded.
