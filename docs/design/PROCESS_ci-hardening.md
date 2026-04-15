---
title: "CI Hardening"
legend: "PROCESS"
cycle: "PROCESS_ci-hardening"
source_backlog: "docs/method/backlog/cool-ideas/PROCESS_ci-hardening.md"
---

# CI Hardening

Source backlog item: `docs/method/backlog/cool-ideas/PROCESS_ci-hardening.md`
Legend: PROCESS

## Sponsors

- Human: Backlog operator
- Agent: Implementation agent

## Hill

CI enforces lint, audit, build, test, and pack verification so no PR
merges without passing all quality gates.

## Playback Questions

### Human

- [ ] Does CI run lint, audit, build, test, and pack verification on every push and pull request?
- [ ] Does the pre-commit hook enforce lint before allowing a commit?

### Agent

- [ ] Does the `npm run lint` script invoke Biome and exit cleanly on the current codebase?

## Accessibility and Assistive Reading

- Linear truth / reduced-complexity posture: CI steps are named in the
  workflow YAML.
- Non-visual or alternate-reading expectations: not in scope.

## Localization and Directionality

- Locale / wording / formatting assumptions: not in scope.
- Logical direction / layout assumptions: not in scope.

## Agent Inspectability and Explainability

- What must be explicit and deterministic for agents: the lint script
  name and biome.json config are committed and readable.
- What must be attributable, evidenced, or governed: CI workflow is in
  `.github/workflows/ci.yml`.

## Non-goals

- [ ] Coverage enforcement thresholds (deferred).
- [ ] Formatters that disagree with the existing code style.
