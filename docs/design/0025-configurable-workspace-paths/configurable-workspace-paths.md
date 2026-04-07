---
title: "Configurable Workspace Paths"
legend: PROCESS
---

# Configurable Workspace Paths

Source: dogfood discovery — METHOD's directory layout is fully hardcoded.
Legend: PROCESS

## Sponsors

- Human: Process Steward
- Agent: Config Architect

## Hill

Make METHOD's workspace directory layout configurable via `.method.json`
so projects can place backlog, design, retro, and other directories
wherever they want.

## Playback Questions

### Human

- [ ] A project with no `.method.json` gets the current default layout
  with no behavioral change.
- [ ] A project with custom paths in `.method.json` has `method init`
  scaffold to those paths and all commands operate against them.
- [ ] The `method status` output reflects the configured paths.

### Agent

- [ ] `src/config.ts` defines a `paths` schema with defaults matching
  the current layout.
- [ ] `Workspace` resolves all paths from config, not from global
  constants.
- [ ] `detectWorkspaceDrift` accepts the tests directory from config.
- [ ] Tests prove both default and custom path configurations work.

## Accessibility and Assistive Reading

Not in scope.

## Localization and Directionality

Not in scope.

## Agent Inspectability and Explainability

Path configuration is explicit in `.method.json` and visible via
`method status`.

## Non-goals

- [ ] Runtime path migration (moving existing files to new paths).
- [ ] Per-lane path configuration (all lanes live under one backlog dir).
- [ ] Making `CHANGELOG.md` or `BEARING.md` locations configurable
  (these are repo conventions, not METHOD internals).
