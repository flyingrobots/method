---
title: "MCP Runtime Input Validation Audit"
legend: PROCESS
lane: bad-code
owner: "METHOD maintainers"
priority: medium
acceptance_criteria:
  - "Every audited MCP mutation tool rejects invalid runtime inputs before mutating repo state."
  - "Validation failures return the canonical MCP error envelope documented in docs/MCP.md and implemented by src/mcp.ts:errorResult."
  - "Tests assert the exact envelope shape for at least one invalid-input case per audited tool."
---

# MCP Runtime Input Validation Audit

`method_close` just proved that MCP tool schemas are not enough on their
own. The runtime handler can still accept structurally invalid inputs if
it trusts type assertions instead of validating the actual request.

This is bad code because the advertised tool contract and the code path
can silently diverge. One tool was repaired here, but the rest of the
MCP surface should be audited for the same schema-vs-runtime gap.

## Acceptance Criteria

- [ ] Audit `method_inbox`, `method_pull`, `method_close`,
      `method_sync_ship`, `method_sync_github`, and
      `method_capture_witness` for schema-vs-runtime gaps before any
      repo mutation happens.
- [ ] On validation failure, each audited tool returns the canonical MCP
      error envelope documented in `docs/MCP.md` and implemented by
      `src/mcp.ts#errorResult`:
      `structuredContent.tool`, `structuredContent.ok: false`,
      `structuredContent.error.message`, and `isError: true`.
- [ ] Add or update tests so at least one invalid-input case per audited
      tool asserts the exact error envelope shape and field names rather
      than only checking prose in `content[0].text`.
- [ ] Record which audited tools already conform, which required code
      changes, and where the enforcing tests live so the audit is
      reviewable without rediscovering scope.
