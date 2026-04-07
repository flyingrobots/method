---
title: "OSS Release Scaffolding"
legend: PROCESS
---

# OSS Release Scaffolding

Source: dogfood discovery — missing standard GitHub OSS files and
reference documentation for CLI and MCP.
Legend: PROCESS

## Sponsors

- Human: Process Steward
- Agent: Documentation Author

## Hill

Ship the standard GitHub community files and reference documentation
required for a credible open-source release.

## Playback Questions

### Human

- [ ] The repo has LICENSE (Apache 2.0), CONTRIBUTING.md, SECURITY.md,
  and NOTICE files.
- [ ] ARCHITECTURE.md explains how the source code is organized.
- [ ] The CLI commands are documented with usage, flags, and examples.
- [ ] The MCP tools are documented with parameters and descriptions.

### Agent

- [ ] `tests/docs.test.ts` proves the required OSS files exist.
- [ ] `tests/docs.test.ts` proves ARCHITECTURE.md contains expected
  sections (overview, source layout, key modules).
- [ ] CLI and MCP reference docs exist and name every command/tool.

## Accessibility and Assistive Reading

Not in scope. Markdown prose only.

## Localization and Directionality

Not in scope. English-only.

## Agent Inspectability and Explainability

Not in scope.

## Non-goals

- [ ] Comprehensive API reference (JSDoc/typedoc level).
- [ ] Tutorial or getting-started guide (that's a separate cycle).
