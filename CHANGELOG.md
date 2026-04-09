# Changelog

## Unreleased

- No externally meaningful changes recorded yet.

## v1.0.0

First semver-major release. Thirty-three cycles are closed, one active
cycle remains open on `main`, and the package/runtime surface is now
shaped for durable external use.

### Breaking Changes

- `Workspace.closeCycle(cycleName, completedDriftCheck, outcome)` now
  requires the `outcome` argument. Downstream `Workspace` consumers must
  update any direct calls to pass one of `hill-met`, `partial`, or
  `not-met`. Migration example:
  `await workspace.closeCycle('0033-bearing-truthfulness', true, 'hill-met')`.

### Added

- Native review-state visibility through `method review-state` and
  `method_review_state`, including merge-readiness blockers, current-branch
  PR resolution, unresolved-thread counts, and check summaries.
- Internal release and migration artifacts for `v1.0.0`, including a
  user-facing migration guide.

### Fixed

- Tightened MCP runtime behavior around GitHub sync flag parsing,
  explicit legend normalization, backlog path confinement, and
  review-state classification.
- Slimmed the packed npm artifact so it ships the built `dist/` runtime
  plus essential metadata instead of repo source, tests, and internal
  docs.
- Refreshed repo signposts and release surfaces so they reflect the
  current post-`v0.3.0` state honestly.

### Released Cycle Work

- Backlog Metadata Single Source Of Truth (0030-backlog-metadata-single-source-of-truth)
- Generated Doc Scaffold Contract (0031-generated-doc-scaffold-contract)
- MCP Tool Result Contract (0032-mcp-tool-result-contract)
- BEARING Truthfulness (0033-bearing-truthfulness)

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

### Released Cycle Work

- CLI, witness, drift, CI, API, MCP, and workflow groundwork (0001–0021)
- Method Consistency Fixes (0022-method-consistency-fixes)
- Drift Near-Miss Hints (0023-drift-near-miss-hints)
- Async Exec Refactor (0024-async-exec-refactor)
- Configurable Workspace Paths (0025-configurable-workspace-paths)
- OSS Release Scaffolding (0026-oss-release-scaffolding)
- Generated Reference Signposts (0027-generated-reference-signposts)
- Hybrid Signpost Generation (0028-hybrid-signpost-generation)
- Bad Code Cleanup (0029-bad-code-cleanup)
