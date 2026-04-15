---
title: "Backlog Lane Materialization Contract"
legend: "PROCESS"
cycle: "PROCESS_backlog-lane-materialization-contract"
source_backlog: "docs/method/backlog/bad-code/PROCESS_backlog-lane-materialization-contract.md"
---

# Backlog Lane Materialization Contract

Source backlog item: `docs/method/backlog/bad-code/PROCESS_backlog-lane-materialization-contract.md`
Legend: PROCESS

## Sponsors

- Human: Backlog operator
- Agent: Implementation agent

These labels are abstract roles. In this design, `user` means the served
perspective, like in a user story, not a literal named person or
specific agent instance.

## Hill

Lane-materialization expectations are named once in `SCAFFOLD_LANES`
and shared across init, doctor, and status so the contract is
reviewable without reverse-engineering scattered checks.

## Playback Questions

### Human

- [ ] Does `init` create directories for all scaffold lanes?
- [ ] Does `status` report empty lanes as empty instead of treating missing lane directories as failures?

### Agent

- [ ] Does `SCAFFOLD_LANES` define which lane directories `init` creates, and is it the same set as `LANES`?

## Accessibility and Assistive Reading

- Linear truth / reduced-complexity posture: the contract is a single
  JSDoc comment on `SCAFFOLD_LANES` in `domain.ts`.
- Non-visual or alternate-reading expectations: not in scope.

## Localization and Directionality

- Locale / wording / formatting assumptions: not in scope.
- Logical direction / layout assumptions: not in scope.

## Agent Inspectability and Explainability

- What must be explicit and deterministic for agents: `SCAFFOLD_LANES`
  is an exported constant agents can import to know the canonical set.
- What must be attributable, evidenced, or governed: the contract
  docstring on `SCAFFOLD_LANES` explains the rules.

## Non-goals

- [ ] Force every repo to keep all lane directories checked in.
- [ ] Reinterpret lane priority semantics.
