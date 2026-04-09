---
title: "MCP Runtime Input Validation Audit"
legend: PROCESS
lane: bad-code
---

# MCP Runtime Input Validation Audit

`method_close` just proved that MCP tool schemas are not enough on their
own. The runtime handler can still accept structurally invalid inputs if
it trusts type assertions instead of validating the actual request.

This is bad code because the advertised tool contract and the code path
can silently diverge. One tool was repaired here, but the rest of the
MCP surface should be audited for the same schema-vs-runtime gap.

## Acceptance Criteria

- [ ] Each MCP mutation tool validates or rejects runtime inputs before
      mutating repo state.
- [ ] Structured error responses stay clear and consistent when
      validation fails.
- [ ] Tests cover at least one invalid-input case for each audited tool.
