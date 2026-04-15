---
title: "Workspace Operation Split"
legend: "PROCESS"
cycle: "PROCESS_workspace-operation-split"
source_backlog: "docs/method/backlog/bad-code/PROCESS_workspace-operation-split.md"
---

# Workspace Operation Split

Source backlog item: `docs/method/backlog/bad-code/PROCESS_workspace-operation-split.md`
Legend: PROCESS

## Sponsors

- Human: Backlog operator
- Agent: Implementation agent

These labels are abstract roles. In this design, `user` means the served
perspective, like in a user story, not a literal named person or
specific agent instance.

## Hill

Extract the largest standalone function clusters from `src/index.ts`
into focused modules so the Workspace class is a thin facade over
navigable, testable subsystems.

## Playback Questions

### Human

- [ ] Is the Workspace class in `src/index.ts` a thinner facade after the extraction, with cycle and utility logic in focused modules?

### Agent

- [ ] Do `src/cycle-ops.ts` and `src/workspace-utils.ts` export the functions that `src/index.ts` previously defined locally?

## Accessibility and Assistive Reading

- Linear truth / reduced-complexity posture: each extracted module has
  a single responsibility readable from its filename.
- Non-visual or alternate-reading expectations: not in scope.

## Localization and Directionality

- Locale / wording / formatting assumptions: not in scope.
- Logical direction / layout assumptions: not in scope.

## Agent Inspectability and Explainability

- What must be explicit and deterministic for agents: all extracted
  functions are named exports so agents can import them directly.
- What must be attributable, evidenced, or governed: the public
  Workspace API is unchanged; only internal organization moved.

## Non-goals

- [ ] Extract every private method into a separate module.
- [ ] Change the public Workspace API surface.
- [ ] Break existing tests or import paths.
