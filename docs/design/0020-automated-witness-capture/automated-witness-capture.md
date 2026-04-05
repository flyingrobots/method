---
title: "Automated Witness Capture"
legend: SYNTH
---

# Automated Witness Capture

Source backlog item: `docs/method/backlog/up-next/SYNTH_automated-witness-capture.md`
Legend: SYNTH

## Sponsors

- Human: @james
- Agent: @gemini-cli

## Hill

Leverage the programmable `Method` API and MCP server to automate the
capture of verification witnesses (terminal transcripts and test
results) during the `method close` loop. This ensures that every cycle
ends with a consistent, evidence-backed verification packet without
manual copy-pasting.

## Playback Questions

### Human

- [ ] `method close` (or a sub-command) automatically generates a
  `verification.md` with real test and CLI results.
- [ ] The generated witness matches the actual state of the repository
  at close.

### Agent

- [ ] `src/index.ts` provides a `captureWitness()` method that
  orchestrates the recording.
- [ ] `tests/witness.test.ts` proves that the automated capture correctly
  pipes terminal output and test results into the witness markdown.
- [ ] The MCP server exposes a `method_capture_witness` tool.

## Accessibility and Assistive Reading

- Linear truth / reduced-complexity posture: Automated transcripts
  provide a verbatim record of the verification phase, reducing the risk
  of human-introduced gaps in the provenance chain.
- Non-visual or alternate-reading expectations: Structured witness
  artifacts are easier for agents and screen readers to parse than
  hand-authored summaries.

## Localization and Directionality

- Locale / wording / formatting assumptions: Standard English headings
  for the witness doc.

## Agent Inspectability and Explainability

- What must be explicit and deterministic for agents: The commands
  executed during capture must be recorded exactly.
- What must be attributable, evidenced, or governed: The witness
  provides the "proof of work" for the entire cycle.

## Non-goals

- [ ] Automating visual screenshots (keeping it text-based for now).
- [ ] Changing the existing retro doc template.

## Backlog Context

Leverage the programmable API and MCP server to automate the capture of
verification witnesses (transcripts, test results) during the 'method
close' loop.
