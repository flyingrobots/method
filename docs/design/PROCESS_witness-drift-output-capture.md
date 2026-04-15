---
title: "Witness Drift Output Capture"
legend: "PROCESS"
cycle: "PROCESS_witness-drift-output-capture"
source_backlog: "docs/method/backlog/bad-code/PROCESS_witness-drift-output-capture.md"
---

# Witness Drift Output Capture

Source backlog item: `docs/method/backlog/bad-code/PROCESS_witness-drift-output-capture.md`
Legend: PROCESS

## Sponsors

- Human: Backlog operator
- Agent: Implementation agent

## Hill

`captureWitness()` records the actual drift report for the active cycle
in `verification.md` instead of dropping to the empty placeholder when
the drift capture path cannot shell out to `tsx`.

## Playback Questions

### Human

- [ ] Does automated witness capture record the actual drift output for the active cycle?

### Agent

- [ ] Does `captureWitness()` record `detectDrift(cycle.name).output` directly instead of shelling out through `tsx`?

## Accessibility and Assistive Reading

- Linear truth / reduced-complexity posture:
  the witness must contain the same drift text a human would rely on
  from `method drift`, without requiring shell or PATH debugging to
  understand why the packet is blank.
- Non-visual or alternate-reading expectations:
  the evidence should remain plain Markdown text in the witness file so
  agents and screen-reader users can inspect the captured drift result
  directly.

## Localization and Directionality

- Locale / wording / formatting assumptions:
  English CLI output is acceptable; the key is that the captured drift
  text is the real repo-visible report, not a placeholder.
- Logical direction / layout assumptions:
  plain text and filesystem paths only; no layout-sensitive behavior.

## Agent Inspectability and Explainability

- What must be explicit and deterministic for agents:
  witness capture must use a bounded code path whose output can be
  traced directly to `detectDrift(cycle.name)` rather than ambient PATH
  state.
- What must be attributable, evidenced, or governed:
  the fix needs a regression that proves the witness includes the actual
  drift report and that drift capture no longer depends on a missing
  `tsx` binary.

## Non-goals

- [ ] Redesign the entire witness capture flow.
- [ ] Change how `npm test` is captured in the witness packet.
- [ ] Broaden this cycle into general exec-command error handling.

## Backlog Context

`captureWitness()` is still not reliably capturing the output of the
drift command into `verification.md`. During cycle `0031`, the standalone
`method drift 0031-generated-doc-scaffold-contract` command returned the
expected clean summary, but the generated witness still recorded an
empty `## Drift Results` block.

That is real repo-truth drift inside the witness packet itself. The
close flow is claiming automated evidence capture, but one of the key
artifacts is blank even when the source command had meaningful output.

This should be fixed with a targeted regression test so witness packets
carry the actual drift output they observed at close time.
