---
title: "Retro Conversational Closeout"
legend: "PROCESS"
cycle: "PROCESS_retro-conversational-closeout"
source_backlog: "docs/method/backlog/cool-ideas/PROCESS_retro-conversational-closeout.md"
---

# Retro Conversational Closeout

Source backlog item: `docs/method/backlog/cool-ideas/PROCESS_retro-conversational-closeout.md`
Legend: PROCESS

## Sponsors

- Human: Backlog operator
- Agent: Implementation agent

## Hill

`method close` requires human witness verification before completing
and prompts for retro content (summary, drift, debt, ideas) so retro
docs ship with real content instead of TBD skeletons.

## Playback Questions

### Human

- [ ] Does `method close` require human witness verification before writing the retro?
- [ ] Does the retro doc contain the summary provided during close instead of TBD?

### Agent

- [ ] Does `closeCycle` accept optional retro content and pass it through to the rendered retro doc?
- [ ] Does `--witness-verified` skip the interactive witness confirmation prompt?

## Accessibility and Assistive Reading

- Linear truth / reduced-complexity posture: prompts are single-line
  text questions with clear labels.
- Non-visual or alternate-reading expectations: not in scope.

## Localization and Directionality

- Locale / wording / formatting assumptions: English prompts.
- Logical direction / layout assumptions: not in scope.

## Agent Inspectability and Explainability

- What must be explicit and deterministic for agents: `--witness-verified`
  and `--summary` flags allow non-interactive close for MCP and tests.
- What must be attributable, evidenced, or governed: witness verification
  is recorded as an attestation gate, not a silent skip.

## Non-goals

- [ ] Multi-turn conversational retro flow (deferred).
- [ ] Structured retro templates beyond the current sections.
