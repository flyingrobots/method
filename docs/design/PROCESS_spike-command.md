---
title: "Spike Command"
legend: "PROCESS"
cycle: "PROCESS_spike-command"
source_backlog: "docs/method/backlog/cool-ideas/PROCESS_spike-command.md"
---

# Spike Command

Source backlog item: `docs/method/backlog/cool-ideas/PROCESS_spike-command.md`
Legend: PROCESS

## Sponsors

- Human: Backlog operator
- Agent: Implementation agent

## Hill

`method spike` captures behavior spikes as first-class backlog items
with SPIKE legend and structured scaffolding (goal, stack constraints,
expected outcome), exposed via CLI and MCP.

## Playback Questions

### Human

- [ ] Does `method spike` create a SPIKE-prefixed backlog item with structured scaffolding?

### Agent

- [ ] Does `method_spike` return structured content with the created spike path?

## Accessibility and Assistive Reading

- Linear truth / reduced-complexity posture: spike body has clear
  sections (Stack Constraints, Expected Outcome).
- Non-visual or alternate-reading expectations: not in scope.

## Localization and Directionality

- Locale / wording / formatting assumptions: not in scope.
- Logical direction / layout assumptions: not in scope.

## Agent Inspectability and Explainability

- What must be explicit and deterministic for agents: the MCP tool
  returns the created path and metadata in structured content.
- What must be attributable, evidenced, or governed: the SPIKE legend
  is set automatically; the scaffolding matches the behavior-spike
  convention in process.md.

## Non-goals

- [ ] Auto-pulling spikes into cycles.
- [ ] Spike-specific close/retire flow.
