---
title: "method_status Summary Mode"
legend: MCP
lane: graveyard
---

# MCP: method_status summary mode

`method_status` returns the full backlog expanded — every item with path,
legend, slug, lane. For git-warp this is 68KB of JSON (215 backlog items).

Most callers just want lane counts and active cycle names. The full
expansion blows through agent context windows and adds no value for the
common "where are we?" check.

## Disposition

Retired as a separate backlog item in cycle `0032-mcp-tool-result-contract`.
The summary-mode behavior was absorbed into the broader MCP structured
result contract, so `method_status` now defaults to compact structured
summary output instead of needing a standalone follow-on.

## Proposal

Add an optional `summary` parameter (default `true`) to `method_status`.

**Summary mode** returns:
- Lane counts: `{ inbox: 4, asap: 22, "up-next": 15, "cool-ideas": 50, "bad-code": 124 }`
- Active cycle stems
- Retro count
- Legend groups (if any)

**Full mode** (`summary: false`) returns the current expanded output.

## Context

Discovered during dogfooding all 4 MCP servers in git-warp. Graft, Think,
and Bijou all return concise responses. METHOD is the outlier at 68KB for
a status check.
