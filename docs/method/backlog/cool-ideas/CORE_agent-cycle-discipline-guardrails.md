---
title: "Agent cycle discipline guardrails"
legend: CORE
lane: cool-ideas
---

# Agent cycle discipline guardrails

Agents (including me) skip Method cycle steps when executing fast. This session I burned through 36 bad-code cards without writing a single design doc or retro — just deleting cards like a checklist. That's a process violation that loses institutional memory.

Possible guardrails:
- `method` MCP tool that refuses to retire/move backlog cards unless a retro exists for the associated cycle
- Pre-commit hook that warns when backlog cards are deleted without a corresponding retro file
- Agent instructions (AGENTS.md) that make the cycle loop a hard requirement, not advisory
- A `method audit` command that detects "orphaned retirements" — cards that were deleted without cycle closure
