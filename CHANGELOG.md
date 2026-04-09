# Changelog

## Unreleased

### Fixed

- Tightened MCP runtime behavior around GitHub sync flag parsing,
  explicit legend normalization, and design-doc frontmatter escaping.
- Hardened the review-facing docs backlog items so their acceptance
  criteria and historical notes match the live contract.

## v0.3.0

First public release. 29 cycles closed, 127 tests passing.

### Features

- TypeScript CLI (`method`) with commands: init, inbox, pull, close,
  drift, status, mcp, sync github, sync ship.
- MCP server exposing all workspace operations for agent integration.
- Two-way GitHub Issue synchronization (push and pull).
- Drift detection with near-miss hints (Jaccard token similarity).
- Configurable workspace paths via `.method.json`.
- Hybrid signpost generation with `<!-- generate:NAME -->` markers.
- Automated witness capture during cycle close.
- YAML frontmatter on all documents, enforced by test suite.
- Zod-validated domain schemas and GitHub API responses.
- Full OSS scaffolding: LICENSE (Apache 2.0), CONTRIBUTING, SECURITY,
  NOTICE, ARCHITECTURE.

### Architecture

- Hexagonal architecture: domain core, CLI adapter, MCP adapter,
  GitHub adapter.
- Workspace class delegates to focused modules: frontmatter.ts,
  renderers.ts, drift.ts, generate.ts.
- Async exec via `execFile` (no shell) and `@git-stunts/plumbing`
  for git operations.

### Documentation

- README: doctrine, filesystem structure, cycle loop, signpost table.
- ARCHITECTURE.md: source layout (generated), key modules, deps.
- docs/CLI.md: command reference (generated from source).
- docs/MCP.md: tool reference (generated from source).
- docs/GUIDE.md: operator advice with generated signpost inventory.
- docs/BEARING.md: generated direction signpost.
- docs/VISION.md: generated executive synthesis.
