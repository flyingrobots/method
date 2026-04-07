---
title: "Hybrid Signpost Generation"
legend: PROCESS
---

# Hybrid Signpost Generation

Source: dogfood discussion — fully-generated signposts lose hand-authored
prose; fully-manual signposts drift from code.
Legend: PROCESS

## Sponsors

- Human: Process Steward
- Agent: Signpost Generator

## Hill

Replace the fully-generated signpost approach with a hybrid model.
Hand-authored prose stays. Sections marked with
`<!-- generate:NAME -->` / `<!-- /generate -->` get their content
replaced on ship sync.

## Playback Questions

### Human

- [ ] Ship sync replaces content between generate markers without
  touching surrounding prose.
- [ ] CLI.md, MCP.md, and GUIDE.md use generate markers for their
  reference sections.
- [ ] Hand-written content outside markers survives regeneration.

### Agent

- [ ] A `replaceGeneratedSections` function finds marker pairs and
  replaces their content using a registry of named generators.
- [ ] Generators exist for `cli-commands`, `mcp-tools`, and
  `signpost-inventory`.
- [ ] Tests prove markers are respected and content outside is
  preserved.

## Accessibility and Assistive Reading

Not in scope.

## Localization and Directionality

Not in scope.

## Agent Inspectability and Explainability

Generate markers are HTML comments — invisible in rendered markdown
but visible in source, making the contract explicit.

## Non-goals

- [ ] Generating ARCHITECTURE.md content (stays fully hand-authored).
- [ ] Generating README.md content.
- [ ] Nested or conditional generation markers.
