---
title: "Drift Score Visibility"
legend: "PROCESS"
cycle: "PROCESS_drift-score-visibility"
source_backlog: "docs/method/backlog/cool-ideas/PROCESS_drift-score-visibility.md"
---

# Drift Score Visibility

Source backlog item: `docs/method/backlog/cool-ideas/PROCESS_drift-score-visibility.md`
Legend: PROCESS

## Sponsors

- Human: Backlog operator
- Agent: Implementation agent

## Hill

Near-miss hints in drift output display the similarity score as a
percentage so operators can judge whether a hint is barely related or
almost exact.

## Playback Questions

### Human

- [ ] Does the drift detector show the similarity score alongside near-miss hints?

### Agent

- [ ] Does the drift detector show the similarity score alongside near-miss hints?

## Accessibility and Assistive Reading

- Linear truth / reduced-complexity posture: score is a plain integer percentage.
- Non-visual or alternate-reading expectations: not in scope.

## Localization and Directionality

- Locale / wording / formatting assumptions: not in scope.
- Logical direction / layout assumptions: not in scope.

## Agent Inspectability and Explainability

- What must be explicit and deterministic for agents: the percentage is
  deterministic (Jaccard on stemmed tokens, rounded to integer).
- What must be attributable, evidenced, or governed: the score is shown
  inline with the near-miss text.

## Non-goals

- [ ] Change the matching algorithm.
- [ ] Add JSON output for scores.
