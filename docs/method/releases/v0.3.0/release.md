---
title: "Release v0.3.0"
---

# Release v0.3.0

## Version Justification

v0.3.0 is the first public release. The version reflects that METHOD
has been through 29 cycles of development, has a working CLI, MCP
server, GitHub adapter, drift detection with near-miss hints,
configurable workspace paths, hybrid signpost generation, and full
OSS scaffolding — but has not yet been published to a registry or
tagged.

v0.1.0 and v0.2.0 were internal development milestones (never tagged).
v0.3.0 is the "it works, it's documented, it's been audited" milestone.

## Included Cycles

- 0001–0021: CLI foundations, enforcement, maturity, connectivity,
  workflow
- 0022: Method consistency fixes (branch naming, RED breadth, lane
  conformance)
- 0023: Drift near-miss hints
- 0024: Async exec refactor
- 0025: Configurable workspace paths
- 0026: OSS release scaffolding (LICENSE, CONTRIBUTING, SECURITY,
  NOTICE, ARCHITECTURE)
- 0027: Generated reference signposts (CLI.md, MCP.md from source)
- 0028: Hybrid signpost generation (generate markers)
- 0029: Bad code cleanup (depth limits, YAML library, GitHub API
  validation, god class decomposition)

Plus: shell injection fix, captureIdea frontmatter fix, symlink CLI
fix, @git-stunts/plumbing adoption.

## Hills Advanced

- A developer can install METHOD and run the full cycle loop.
- An agent can operate METHOD via MCP tools.
- The workspace layout is configurable.
- Signpost docs are generated from source and can never drift.
- All audit findings are resolved or backlogged.

## Affected Users

Solo developers working with agents. METHOD is designed for a human
and an agent sharing a repo.

## Migration

No migration required. This is the first release.

## SemVer Impact

Minor (0.3.0). No prior public API to break.
