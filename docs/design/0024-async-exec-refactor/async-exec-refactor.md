---
title: "Async Exec Refactor"
legend: PROCESS
---

# Async Exec Refactor

Source backlog item: `docs/method/backlog/bad-code/PROCESS_async-exec-refactor.md`
Legend: PROCESS

## Sponsors

- Human: Process Steward
- Agent: Runtime Hardener

## Hill

Replace synchronous `execSync` in `Workspace.execCommand` with an
async implementation so the event loop is not blocked during witness
capture.

## Playback Questions

### Human

- [ ] `method close` still captures a witness with test and drift
  output, and the output format is unchanged.
- [ ] The async exec supports a configurable timeout.

### Agent

- [ ] `Workspace.execCommand` returns a Promise and uses
  `child_process.exec` or equivalent async API.
- [ ] `captureWitness` and `closeCycle` are async and awaited by their
  callers (CLI and MCP).
- [ ] `METHOD_TEST` mock path still works and returns the same format.
- [ ] A dedicated test proves timeout cancellation behavior.

## Accessibility and Assistive Reading

Not in scope. No output format changes.

## Localization and Directionality

Not in scope.

## Agent Inspectability and Explainability

Not in scope. Internal refactor only.

## Non-goals

- [ ] Changing the witness output format.
- [ ] Streaming output during capture (batch is fine).
- [ ] Changing the public API surface beyond making methods async.
