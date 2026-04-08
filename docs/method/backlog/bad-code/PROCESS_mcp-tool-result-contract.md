---
title: "MCP Tool Result Contract"
legend: PROCESS
lane: bad-code
---

# MCP Tool Result Contract

The MCP server still returns tool results as ad hoc text blobs. Even the
test that asks whether an MCP client can interact without parsing
terminal text is effectively answered with string-contains assertions on
`content[0].text`. This is expensive and fragile for agents, especially
when status payloads are large or when callers need stable field-level
results.

METHOD needs a more explicit structured result contract for MCP tools so
agents can consume repo state and mutations without scraping prose.
