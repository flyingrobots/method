---
title: "Dist Output Pruning"
legend: "PROCESS"
cycle: "PROCESS_dist-output-pruning"
source_backlog: "docs/method/backlog/bad-code/PROCESS_dist-output-pruning.md"
---

# Dist Output Pruning

Source backlog item: `docs/method/backlog/bad-code/PROCESS_dist-output-pruning.md`
Legend: PROCESS

## Sponsors

- Human: Backlog operator
- Agent: Implementation agent

These labels are abstract roles. In this design, `user` means the served
perspective, like in a user story, not a literal named person or
specific agent instance.

## Hill

The standard build path removes stale `dist/` artifacts before emit so
the published tree is always a faithful projection of current source.

## Playback Questions

### Human

- [ ] Does the standard build path remove stale `dist/` artifacts before emit?

### Agent

- [ ] Does CI or release pre-flight fail when `dist/` no longer matches the live `src/` module set?

## Accessibility and Assistive Reading

- Linear truth / reduced-complexity posture: not in scope (build tooling).
- Non-visual or alternate-reading expectations: not in scope.

## Localization and Directionality

- Locale / wording / formatting assumptions: not in scope.
- Logical direction / layout assumptions: not in scope.

## Agent Inspectability and Explainability

- What must be explicit and deterministic for agents: the build script
  is readable in `package.json`; agents can verify the clean step.
- What must be attributable, evidenced, or governed: the test suite
  asserts the build script shape.

## Non-goals

- [ ] Adding a separate `clean` script or pre-build hook.
- [ ] Validating dist contents beyond the clean-before-emit guarantee.
