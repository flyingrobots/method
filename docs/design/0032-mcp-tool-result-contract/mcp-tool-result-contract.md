---
title: "MCP Tool Result Contract"
legend: PROCESS
cycle: "0032-mcp-tool-result-contract"
source_backlog: "docs/method/backlog/asap/PROCESS_mcp-tool-result-contract.md"
---

# MCP Tool Result Contract

Source backlog item: `docs/method/backlog/asap/PROCESS_mcp-tool-result-contract.md`
Legend: PROCESS

## Sponsors

- Human: MCP client operator
- Agent: Structured-response consumer

## Hill

MCP tools expose a stable structured result contract through
`structuredContent`, and `method_status` defaults to a compact summary
mode so callers can answer "where are we?" without pulling the whole
workspace graph into context. Text remains as fallback narration, not as
the primary machine interface.

## Playback Questions

### Human

- [ ] Does `method_status` return summary-shaped structured content by
      default, with lane counts instead of the fully expanded backlog?
- [ ] Can I request `method_status` full mode and still receive the
      expanded structured workspace state without scraping text?

### Agent

- [ ] Do mutation tools (`method_inbox`, `method_pull`, `method_close`,
      `method_capture_witness`) return stable field-level structured
      content for paths and cycles?
- [ ] On MCP errors, can I inspect a structured error object instead of
      only a prose message?

## Accessibility and Assistive Reading

- Linear truth / reduced-complexity posture: summary mode should make
  the common status query small enough to inspect quickly without
  scrolling through every backlog item.
- Non-visual or alternate-reading expectations: structured fields must
  carry the contract so agents and alternate readers are not forced to
  reverse-engineer human prose.

## Localization and Directionality

- Locale / wording / formatting assumptions: the contract should not
  depend on English phrasing inside `content[0].text`.
- Logical direction / layout assumptions: none; this is a field-level
  protocol contract.

## Agent Inspectability and Explainability

- What must be explicit and deterministic for agents: the envelope shape,
  success/error distinction, and the difference between summary and full
  status mode.
- What must be attributable, evidenced, or governed: tests should assert
  `structuredContent` directly for success and error paths rather than
  treating text blobs as the contract.

## Non-goals

- [ ] Replace every possible prose fallback in MCP responses with zero
      text.
- [ ] Rework the underlying workspace domain models beyond what the
      structured contract needs.
- [ ] Solve signpost truth drift; that remains separate work under
      `PROCESS_bearing-truthfulness`.

## Backlog Context

The MCP server still returns tool results as ad hoc text blobs. Even the
test that asks whether an MCP client can interact without parsing
terminal text is effectively answered with string-contains assertions on
`content[0].text`. This is expensive and fragile for agents, especially
when status payloads are large or when callers need stable field-level
results.

METHOD needs a more explicit structured result contract for MCP tools so
agents can consume repo state and mutations without scraping prose.
