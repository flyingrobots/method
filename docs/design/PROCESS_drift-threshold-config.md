---
title: "Drift Threshold Config"
legend: "PROCESS"
cycle: "PROCESS_drift-threshold-config"
source_backlog: "docs/method/backlog/cool-ideas/PROCESS_drift-threshold-config.md"
---

# Drift Threshold Config

Source backlog item: `docs/method/backlog/cool-ideas/PROCESS_drift-threshold-config.md`
Legend: PROCESS

## Sponsors

- Human: Backlog operator
- Agent: Implementation agent

## Hill

Drift detector thresholds are configurable via `.method.json` so repos
with different tolerance for wording variance can tune matching without
forking the tool.

## Playback Questions

### Human

- [ ] Does the drift detector respect configurable thresholds from `.method.json` instead of using hardcoded values?

### Agent

- [ ] Does the drift detector respect configurable thresholds from `.method.json` instead of using hardcoded values?

## Accessibility and Assistive Reading

- Linear truth / reduced-complexity posture: not in scope.
- Non-visual or alternate-reading expectations: not in scope.

## Localization and Directionality

- Locale / wording / formatting assumptions: not in scope.
- Logical direction / layout assumptions: not in scope.

## Agent Inspectability and Explainability

- What must be explicit and deterministic for agents: thresholds are
  readable from `.method.json` and the `Config` type.
- What must be attributable, evidenced, or governed: defaults match the
  previous hardcoded values (0.85 semantic, 0.65 near-miss).

## Non-goals

- [ ] Per-cycle threshold overrides.
- [ ] CLI flags for thresholds.
