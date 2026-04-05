---
title: "Behavior Spike Convention"
legend: PROCESS
---

# Behavior Spike Convention

Source backlog item: `docs/method/backlog/up-next/PROCESS_behavior-spike-convention.md`
Legend: PROCESS

## Sponsors

- Human: Repository Operator
- Agent: System Automator

## Hill

Formalize the "Behavior Spike" as a first-class METHOD convention by
documenting it in `docs/method/process.md`. This convention will define
how temporary implementations should be captured, witnessed, and
honestly retired once they have served their purpose of proving
behavior or buying clarity.

## Playback Questions

### Human

- [ ] `docs/method/process.md` contains a "Behavior Spikes" section
  under "Special Cycles".
- [ ] The convention defines a clear lifecycle: Capture, Execute,
  Witness, and Retire.
- [ ] The distinction between a spike (temporary proof) and a graveyard
  item (abandoned work) is explicit.

### Agent

- [ ] `docs.test.ts` validates that the "Behavior Spikes" section exists
  in the process doc.
- [ ] `docs.test.ts` validates that the lifecycle phases (Capture,
  Execute, Witness, Retire) are documented.

## Accessibility and Assistive Reading

- Linear truth / reduced-complexity posture: Naming the "spike" pattern
  reduces complexity by providing a mental model for temporary work
  that doesn't need to meet full production standards.
- Non-visual or alternate-reading expectations: Clear headings in the
  process doc make the convention easy to find and follow.

## Localization and Directionality

- Locale / wording / formatting assumptions: The convention uses
  standard English engineering terminology ("Spike", "Retire").

## Agent Inspectability and Explainability

- What must be explicit and deterministic for agents: The rules for
  retiring a spike must be explicit so agents don't keep dead code
  alive.
- What must be attributable, evidenced, or governed: Spikes must still
  produce a witness before retirement to prove they met their goals.

## Non-goals

- [ ] Implementing specific CLI tools for spikes (this cycle is about doctrine).
- [ ] Automating the retirement of code.

## Backlog Context

Define a first-class METHOD convention for temporary implementations
that exist to prove behavior, buy clarity, or surface stack
constraints, then get replaced cleanly. The Python METHOD CLI spike is
the model case: it validated the command contract, exercised the loop,
and was honestly discarded once the TypeScript/Bijou fit became clear.
This is not failure and not graveyard. METHOD should name it and say
how to document, witness, and retire it.
