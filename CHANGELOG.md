# Changelog

## Unreleased

- No externally meaningful changes recorded yet.

## v2.0.0

### Breaking Changes

- Design docs are now flat files (`docs/design/<LEGEND>_<slug>.md`)
  instead of directory-per-cycle. The `number` field has been removed
  from the `Cycle` type. Cycle names use `<LEGEND>_<slug>` format.
- `docs/method/process.md` → `docs/PROCESS.md` (signpost)
- `docs/method/release.md` + `release-runbook.md` → `docs/RELEASE.md`
- Retro template changed: "What surprised you?" / "What would you do
  differently?" replaces Drift/New Debt/Cool Ideas sections.
- Sponsors section removed from design doc scaffold.
- `method close` now requires witness verification (`--witness-verified`
  or interactive prompt). MCP `method_close` requires `witnessVerified`.

### Added

- `method spike` command and `method_spike` MCP tool
- `method doctor --receipt` for SHA-locked health attestations
- Three-tier semantic drift matching (exact → semantic → token similarity)
- Drift score percentages in near-miss hints
- Configurable drift thresholds via `.method.json`
- Pull-time backlog readiness warnings
- Conversational retro prompts on close
- Auto-regenerate reference docs on pre-commit
- Type-downgrade protection in frontmatter writes
- Biome linter with CI enforcement
- Pre-commit (lint + sync refs) and pre-push (tests) hooks
- `SCAFFOLD_LANES` as single source of truth
- `cycle-ops.ts` and `workspace-utils.ts` extracted from Workspace

### Fixed

- Clean `dist/` before build (prevents stale artifacts)
- MCP input validation for `method_pull` and `method_capture_witness`
- GitHub comment sync uses stable IDs instead of string matching
- Doctor checks for `.gitkeep` in required directories
- Doctor flatten repair matches by slug convention (prevents data loss)
- Flatten repair preserves non-cycle files in legacy directories
- Null frontmatter values don't block type-downgrade guard
- Duplicated legend prefix stripped from backlog filenames
- Doctor fix text corrected (`method repair --apply`)
- MCP server version aligned with package version

## v1.0.0

First semver-major release. Thirty-six cycles are closed, there are no
open cycle packets on this branch, and the package/runtime surface is
now shaped for durable external use.

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
- Explicit repo-discipline guidance and tests so the METHOD repo treats
  open cycle packets on `main` as stop-and-repair defects instead of
  normal background state.

### Fixed

- Tightened MCP runtime behavior around GitHub sync flag parsing,
  explicit legend normalization, backlog path confinement, and
  review-state classification.
- Added bounded legacy frontmatter-title repair on read so older METHOD
  docs do not require a tracked one-off backfill script just to recover
  a missing `title`.
- Witness packets now capture the actual drift report for the active
  cycle instead of dropping to `No drift output captured.` when `tsx` is
  unavailable on PATH.
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
- Review State Query (0034-review-state-query)
- METHOD Repo Self Discipline (0035-method-repo-self-discipline)
- Witness Drift Output Capture (0036-witness-drift-output-capture)

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
