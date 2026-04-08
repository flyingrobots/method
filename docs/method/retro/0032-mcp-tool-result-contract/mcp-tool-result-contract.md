---
title: "MCP Tool Result Contract"
cycle: "0032-mcp-tool-result-contract"
design_doc: "docs/design/0032-mcp-tool-result-contract/mcp-tool-result-contract.md"
outcome: hill-met
drift_check: yes
---

# MCP Tool Result Contract Retro

Design: `docs/design/0032-mcp-tool-result-contract/mcp-tool-result-contract.md`
Outcome: hill-met
Drift check: yes

## Summary

This cycle replaced MCP text-blob responses with a stable
`structuredContent` envelope across the server, added default summary
mode to `method_status` with opt-in full mode, and rewrote the MCP tests
to assert field-level results and structured errors directly. The
standalone `MCP_status-summary-mode` follow-on was retired into the
graveyard because its behavior is now absorbed by the broader contract
fix.

## Playback Witness

- [Verification Witness](./witness/verification.md)

## Drift

- None recorded.

## New Debt

- `PROCESS_witness-drift-output-capture` remains open: the close-time
  verification witness still records an empty `## Drift Results` block
  even when the standalone drift command returns output.

## Cool Ideas

- None recorded.

## Backlog Maintenance

- [x] Inbox processed
- [x] Priorities reviewed
- [x] Dead work buried or merged
