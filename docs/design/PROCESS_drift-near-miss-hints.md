---
title: "Drift Near-Miss Hints"
legend: PROCESS
---

# Drift Near-Miss Hints

Source backlog item: `docs/method/backlog/cool-ideas/PROCESS_drift-near-miss-hints.md`
Legend: PROCESS

## Sponsors

- Human: Process Steward
- Agent: Drift Analyst

## Hill

When `method drift` reports an unmatched playback question, show the
closest test description as a near-miss hint so the operator can see
whether the mismatch is trivial (wording) or structural (missing test).

## Playback Questions

### Human

- [ ] When a playback question has no exact match but a test description
  is close, the drift output shows the near-miss candidate.
- [ ] Near-miss hints never change the pass/fail exit code. Drift with
  hints still exits 2.
- [ ] When no test description is remotely close, no hint is shown.

### Agent

- [ ] `detectWorkspaceDrift` includes near-miss hints in the output for
  unmatched questions.
- [ ] The similarity function is deterministic, requires no external
  dependencies, and uses normalized token overlap.
- [ ] A dedicated `tests/drift.test.ts` proves exact match, near-miss
  hint, no-hint, and exit code behavior.

## Accessibility and Assistive Reading

Hints are plain text indented under the unmatched question, readable
in any terminal or screen reader.

## Localization and Directionality

Not in scope. English-only CLI output.

## Agent Inspectability and Explainability

Hints are deterministic and reproducible. The similarity metric is
transparent (token overlap ratio).

## Non-goals

- [ ] LLM-based or embedding-based semantic matching.
- [ ] Changing the pass/fail contract. Exact match remains authority.
- [ ] Configurable similarity thresholds (hardcoded is fine for now).
