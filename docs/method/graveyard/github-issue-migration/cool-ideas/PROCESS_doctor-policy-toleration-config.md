---
title: "Doctor Policy Toleration Config"
legend: PROCESS
lane: cool-ideas
owner: "METHOD maintainers"
priority: low
acceptance_criteria:
  - "The note defines a bounded way for repos to downgrade or suppress selected doctor findings without disabling the entire doctor surface."
  - "The contract distinguishes repo policy from doctor truth: checks still run, but configured tolerations change severity or merge-readiness interpretation."
  - "The proposal names at least one realistic use case such as repos that intentionally do not install git hooks."
  - "The design keeps doctor output inspectable by surfacing the active tolerations in CLI and MCP results."
---

# Doctor Policy Toleration Config

`method doctor` is intentionally opinionated, but some repos will make
deliberate choices that should not read like operational failure. A
simple example is git hooks: some repos will intentionally rely on CI
only, while others may treat missing hooks as a real problem.

Right now METHOD can only emit its built-in judgment. That is clean, but
it forces every repo into the same operational posture even when the
check result is true but not actionable for that repo.

## Proposed Contract

- Config surface:
  allow a bounded doctor policy block in `.method.json`, such as
  `doctor: { tolerations: [...] }`, for named checks or issue codes.
- Scope:
  tolerations may only downgrade or reclassify known doctor findings.
  They must not disable arbitrary code paths or hide unknown failures.
- Output truth:
  doctor output must still include the underlying issue and identify any
  active toleration, for example by adding `tolerated: true` or
  `effective_severity`.
- First practical target:
  support repo choices such as "missing git hooks are informational
  here" without forcing downstream agents or humans to special-case the
  repo manually.

## Non-goals

- Turn doctor into a free-form lint-config framework.
- Let repos hide hard structural failures silently.
- Replace CI or review policy with doctor configuration alone.
