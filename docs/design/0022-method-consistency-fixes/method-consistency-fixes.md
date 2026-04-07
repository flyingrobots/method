---
title: "Method Consistency Fixes"
legend: PROCESS
---

# Method Consistency Fixes

Source backlog items:
- `docs/method/backlog/asap/PROCESS_branch-naming-consistency.md`
- `docs/method/backlog/asap/PROCESS_red-phase-playback-coverage.md`
- `docs/method/backlog/asap/PROCESS_repo-lane-conformance.md`

Legend: PROCESS

## Sponsors

- Human: Process Steward
- Agent: Doctrine Editor

## Hill

Resolve three documentation inconsistencies in METHOD's process docs
so that branch naming, RED phase breadth, and lane conformance each
have one unambiguous rule.

## Playback Questions

### Human

- [ ] Branch naming uses one canonical pattern across `README.md` and
  `docs/method/process.md`, with no contradictory examples.
- [ ] The RED step in `README.md` explicitly names the expected
  test-shape breadth (playback questions, golden path, failure modes,
  edge cases) rather than only "playback questions become specs."
- [ ] Lane conformance has an explicit rule: are lanes required
  structure or created on first use? The answer is documented.

### Agent

- [ ] `tests/docs.test.ts` proves the branch naming rule is consistent
  between `README.md` and `docs/method/process.md`.
- [ ] `tests/docs.test.ts` proves the RED step names test-shape
  categories beyond just playback questions.
- [ ] `tests/docs.test.ts` proves that lane conformance is documented.

## Accessibility and Assistive Reading

Not in scope. This cycle changes only markdown prose.

## Localization and Directionality

Not in scope. English-only documentation changes.

## Agent Inspectability and Explainability

Not in scope. No code changes.

## Non-goals

- [ ] Changing the branch naming convention itself (we adopt the
  existing `cycles/####-slug` pattern already in use).
- [ ] Adding CLI enforcement of lane structure (already handled by
  `method init`).
- [ ] Rewriting the full process doc. Only the conflicting sections
  are touched.
