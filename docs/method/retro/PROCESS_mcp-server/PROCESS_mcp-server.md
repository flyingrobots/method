---
title: "MCP Server"
outcome: hill-met
drift_check: yes
---

# MCP Server Retro

Design: `docs/design/0012-mcp-server/mcp-server.md`
Outcome: hill-met
Drift check: yes

## Summary

This cycle delivered a functional Model Context Protocol (MCP) server for METHOD using the official `@modelcontextprotocol/sdk`. External agents can now query the backlog, pull items, and close cycles using standard JSON-RPC over `stdio`. The server leverages the newly extracted programmable `Method` API from Cycle 0011.

## Playback Witness

Add artifacts under `docs/method/retro/0012-mcp-server/witness` and link them here.

## Drift

- None recorded.

## New Debt

- None recorded.

## Cool Ideas

- Add tools for managing config hardening and legend audit/assignment.

## Backlog Maintenance

- [x] Inbox processed
- [x] Priorities reviewed
- [x] Dead work buried or merged
