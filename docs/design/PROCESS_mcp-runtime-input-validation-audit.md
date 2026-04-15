---
title: "MCP Runtime Input Validation Audit"
legend: "PROCESS"
cycle: "PROCESS_mcp-runtime-input-validation-audit"
source_backlog: "docs/method/backlog/bad-code/PROCESS_mcp-runtime-input-validation-audit.md"
---

# MCP Runtime Input Validation Audit

Source backlog item: `docs/method/backlog/bad-code/PROCESS_mcp-runtime-input-validation-audit.md`
Legend: PROCESS

## Sponsors

- Human: Backlog operator
- Agent: Implementation agent

These labels are abstract roles. In this design, `user` means the served
perspective, like in a user story, not a literal named person or
specific agent instance.

## Hill

Every MCP tool handler validates its arguments at runtime before any
mutation, returning the canonical error envelope on invalid input.

## Playback Questions

### Human

- [ ] Does every MCP tool that accepts user arguments validate them at runtime before performing any mutation?

### Agent

- [ ] Does `method_pull` reject invalid runtime argument types and return the canonical MCP error envelope?
- [ ] Does `method_capture_witness` reject invalid runtime argument types and return the canonical MCP error envelope?

## Accessibility and Assistive Reading

- Linear truth / reduced-complexity posture: error messages name the
  invalid field and expected type.
- Non-visual or alternate-reading expectations: not in scope (MCP API).

## Localization and Directionality

- Locale / wording / formatting assumptions: English error messages.
- Logical direction / layout assumptions: not in scope.

## Agent Inspectability and Explainability

- What must be explicit and deterministic for agents: validation errors
  are returned as `structuredContent.error.message` in the canonical
  envelope so agents can programmatically detect and retry.
- What must be attributable, evidenced, or governed: each audited tool
  has at least one invalid-input test asserting the error envelope.

## Non-goals

- [ ] Schema-level validation (MCP SDK handles this).
- [ ] Changing the error envelope format.

## Audit Results

| Tool | Status | Notes |
|------|--------|-------|
| method_inbox | Already conforms | Uses validateString/validateOptionalString |
| method_pull | **Fixed** | Was `as string` cast, now uses `validateString` |
| method_close | Already conforms | Fixed in prior cycle |
| method_sync_ship | N/A | No user arguments beyond workspace |
| method_sync_refs | N/A | No user arguments beyond workspace |
| method_sync_github | Already conforms | Uses validateOptionalBoolean |
| method_capture_witness | **Fixed** | Was `as string` cast, now uses `validateOptionalString` |
