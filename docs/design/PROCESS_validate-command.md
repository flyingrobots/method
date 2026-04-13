---
title: "Validate Command"
legend: "PROCESS"
cycle: "PROCESS_validate-command"
source_backlog: "docs/method/backlog/cool-ideas/PROCESS_validate-command.md"
---

# Validate Command

Source backlog item: `docs/method/backlog/cool-ideas/PROCESS_validate-command.md`
Legend: PROCESS

## Sponsors

- Human: Backlog operator
- Agent: Implementation agent

## Hill

`pullItem` validates backlog readiness at pull time and emits warnings
for missing acceptance criteria, priority, or legend, so incomplete
items don't silently enter the cycle pipeline.

## Playback Questions

### Human

- [ ] Does `pullItem` warn when a backlog item is missing acceptance criteria or priority?

### Agent

- [ ] Does `pullItem` produce no warnings for a fully shaped backlog item?

## Accessibility and Assistive Reading

- Linear truth / reduced-complexity posture: warnings are plain text
  naming the missing field.
- Non-visual or alternate-reading expectations: not in scope.

## Localization and Directionality

- Locale / wording / formatting assumptions: not in scope.
- Logical direction / layout assumptions: not in scope.

## Agent Inspectability and Explainability

- What must be explicit and deterministic for agents: warnings are
  returned as a string array in the pull result, and included in MCP
  structured content.
- What must be attributable, evidenced, or governed: the readiness
  contract is documented in a JSDoc comment on `validateBacklogReadiness`.

## Non-goals

- [ ] Block pulls on warnings (they're advisory, not errors).
- [ ] A standalone `method validate` command (deferred).
