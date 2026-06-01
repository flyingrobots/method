---
title: "Command Registry Pattern"
legend: PROCESS
lane: cool-ideas
---

# Command Registry Pattern

Adding a new CLI command currently requires editing 3 files (cli-args.ts
for parsing, cli.ts for dispatch, mcp.ts for MCP exposure). A command
registry pattern would let each command be a self-contained module that
exports its name, argument parser, help text, and handler. cli.ts and
mcp.ts iterate the registry instead of hardcoding dispatch chains.

This also enables plugin commands without modifying source.
