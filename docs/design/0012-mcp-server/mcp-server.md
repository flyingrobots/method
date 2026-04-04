---
title: "MCP Server"
legend: PROCESS
---

# MCP Server

Source backlog item: `docs/method/backlog/inbox/PROCESS_mcp-server.md`
Legend: PROCESS

## Sponsors

- Human: @james
- Agent: @gemini-cli

## Hill

Implement a Model Context Protocol (MCP) server that exposes the `Method` API (workspace status, pull, drift, close, etc.) as programmatic tools for AI agents.

## Playback Questions

### Human

- [ ] Can an MCP client connect to `method` and interact with the backlog without parsing terminal text?

### Agent

- [ ] Does `src/mcp.ts` export a functional MCP server using `@modelcontextprotocol/sdk`?
- [ ] Are tools provided for querying the backlog, pulling items, and closing cycles?
- [ ] Do unit tests verify the MCP server integration and its tools?

## Accessibility and Assistive Reading

- Linear truth / reduced-complexity posture: The MCP server returns standard structured protocol messages (JSON) meant for machines.
- Non-visual or alternate-reading expectations: Same as above.

## Localization and Directionality

- Locale / wording / formatting assumptions: Standard MCP tooling JSON responses.
- Logical direction / layout assumptions: None.

## Agent Inspectability and Explainability

- What must be explicit and deterministic for agents: The MCP tools must have well-defined JSON schemas.
- What must be attributable, evidenced, or governed: N/A

## Non-goals

- [ ] Creating an interactive UI for MCP.
- [ ] Extending the underlying Method domain logic.

## Backlog Context

Build an MCP server that exposes the newly extracted Method API surface to external agents, allowing them to programmatically query the backlog, pull items, and close cycles.
