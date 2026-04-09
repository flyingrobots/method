---
title: "Graveyard"
---

# Graveyard

Retired METHOD backlog items and related docs live here when the repo
should remember them but no longer treat them as active work.

## Purpose and Scope

Use the graveyard for backlog items, contracts, or process notes that
were superseded, absorbed by a broader cycle, or explicitly retired.
This directory is not a trash can. Items move here when their history
still matters.

## Retention and Deletion Policy

- Keep graveyard entries while they still explain why a path was closed
  or absorbed.
- Delete only when the historical value is genuinely gone and no live
  artifact depends on the tombstone for context.
- Prefer updating a graveyard doc with final disposition details over
  silently removing it.

## Entry Criteria

- A backlog item was completed indirectly by a broader cycle.
- A standalone proposal was superseded by a stronger contract.
- A document should remain searchable as historical context but should
  not return to active prioritization by default.

## Exit Criteria

- A retired idea becomes live work again and is reintroduced as a new
  backlog item with fresh scope.
- Multiple tombstones are consolidated into a clearer retrospective or
  other durable history artifact.

## Inventory

- `MCP_status-summary-mode.md`
  Retired because cycle `0032-mcp-tool-result-contract` absorbed the
  summary-mode behavior into the broader MCP result contract.
- `PROCESS_live-legend-definition-coverage.md`
  Retired because the live repo no longer uses `MCP` as an active
  legend, so the note's premise stopped being true.
- `PROCESS_legend-should-be-in-frontmatter-yaml.md`
  Retired because cycle `0030-backlog-metadata-single-source-of-truth`
  absorbed the legend-frontmatter follow-on directly.
