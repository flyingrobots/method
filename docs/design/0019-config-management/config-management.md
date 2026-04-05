---
title: "Config Management"
legend: PROCESS
---

# Config Management

Source backlog item: `docs/method/backlog/up-next/PROCESS_config-management.md`
Legend: PROCESS

## Sponsors

- Human: @james
- Agent: @gemini-cli

## Hill

Implement a formal configuration system for METHOD that loads settings
from a `.method.json` file in the repository root. This system will
standardize how credentials (like `github_token`) and repository-local
constants (like `github_repo`) are managed, reducing the reliance on
manual environment variables while allowing them as overrides.

## Playback Questions

### Human

- [ ] A `.method.json` file in the repo root can store GitHub credentials
  and repository paths.
- [ ] `method sync github` correctly picks up settings from the config
  file when environment variables are not provided.
- [ ] Sensible defaults (e.g., `forge: "github"`) are applied when keys are
  missing.

### Agent

- [ ] `src/config.ts` defines a strict `Config` schema using Zod.
- [ ] `tests/config.test.ts` proves that the configuration is loaded,
  validated, and merged with environment overrides correctly.
- [ ] The `Workspace` class provides access to the validated configuration.

## Accessibility and Assistive Reading

- Linear truth / reduced-complexity posture: Centralizing configuration
  in a single file reduces the complexity of managing hidden state across
  different shells or environments.
- Non-visual or alternate-reading expectations: A structured JSON config
  is natively machine-readable and predictable.

## Localization and Directionality

- Locale / wording / formatting assumptions: Field names use `snake_case`.

## Agent Inspectability and Explainability

- What must be explicit and deterministic for agents: The configuration
  resolution order (Env > File > Default) must be deterministic.
- What must be attributable, evidenced, or governed: Invalid configuration
  files must produce clear, schema-backed error messages.

## Non-goals

- [ ] Implementing complex configuration inheritance (one file per repo).
- [ ] Supporting multiple file formats (JSON only for now to keep it simple).

## Backlog Context

Standardize how METHOD handles credentials (e.g., GITHUB_TOKEN) and
repository-local settings through a formal configuration file (e.g.,
.methodrc).
