---
title: "Generated Reference Signposts"
legend: PROCESS
---

# Generated Reference Signposts

Source: dogfood discovery — CLI.md and MCP.md are hand-authored
copies of data that already exists in code.
Legend: PROCESS

## Sponsors

- Human: Process Steward
- Agent: Signpost Generator

## Hill

Generate `docs/CLI.md` and `docs/MCP.md` from source code so they
never drift from the implementation.

## Playback Questions

### Human

- [ ] `method sync ship` regenerates CLI.md and MCP.md alongside
  BEARING and CHANGELOG.
- [ ] The generated docs match the actual CLI usage and MCP tool schemas.

### Agent

- [ ] A `generateCliReference` function produces CLI.md from the
  usage() output in cli-args.ts.
- [ ] A `generateMcpReference` function produces MCP.md from the tool
  schemas in mcp.ts.
- [ ] Both carry `generated_from_commit` in frontmatter.
- [ ] Tests prove the generated content names every command and tool.

## Accessibility and Assistive Reading

Not in scope.

## Localization and Directionality

Not in scope.

## Agent Inspectability and Explainability

Generated docs carry commit SHA provenance.

## Non-goals

- [ ] Generating ARCHITECTURE.md (prose, not mechanical).
- [ ] Generating README.md (doctrine, not reference).
