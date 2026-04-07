# Changelog

## Unreleased

- Configurable Workspace Paths (0025-configurable-workspace-paths)
- Method Consistency Fixes (0022-method-consistency-fixes)
- Drift Near-Miss Hints (0023-drift-near-miss-hints)
- Async Exec Refactor (0024-async-exec-refactor)
- Two-way GitHub Sync (0021-two-way-github-sync)
- Automated Witness Capture (0020-automated-witness-capture)
- Config Management (0019-config-management)
- Method Cli (0001-method-cli)
- Playback Witness Convention (0002-playback-witness-convention)
- Readme Revision (0003-readme-revision)
- Readme And Vision Refresh (0004-readme-and-vision-refresh)
- Drift Detector (0005-drift-detector)
- Ci Gates (0006-ci-gates)
- Cli Module Split (0007-cli-module-split)
- Release Shaping And User Migration Docs (0008-release-shaping-and-user-migration-docs)
- Generated Signpost Provenance (0009-generated-signpost-provenance)
- Yaml Frontmatter Schema (0010-yaml-frontmatter-schema)
- Library API Surface (0011-library-api-surface)
- MCP Server (0012-mcp-server)
- Executive Summary Protocol (0013-executive-summary-protocol)
- GitHub issue adapter (0014-github-issue-adapter)
- Git branch workflow policy (0015-git-branch-workflow-policy)
- System-Style JavaScript Adoption (0016-system-style-javascript-adoption)
- Behavior Spike Convention (0017-behavior-spike-convention)
- Ship Sync Automation (0018-ship-sync-automation)
### Fixed

- Resolved review feedback on PR #5: revised release runbook bullets for
  clarity, enforced phase heading order in tests, and clarified
  commitment and signpost boundedness invariants.

## Unreleased

- Formalized the "Behavior Spike" convention in `docs/method/process.md`,
  defining a 4-phase lifecycle (Capture, Execute, Witness, Retire) for
  temporary implementations.
- Adopted the "System-Style JavaScript" standard as repo doctrine,
  documenting core principles like runtime truth and hexagonal
  architecture in `docs/method/process.md`.
- Hardened domain models in `src/domain.ts` using Zod for runtime
  validation, ensuring boundary data is honest and core logic is
  browser-portable.
- Added a formal Git branch and workflow policy in `docs/method/process.md`,
  defining naming conventions (`####-slug`, `maint-slug`) and the
  "Ship Sync Maneuver" for signpost maintenance.
- Implemented a GitHub Issue Adapter (`method sync github`) that
  synchronizes backlog items to GitHub issues and persists IDs in
  YAML frontmatter.
- Formalized the "Executive Summary Protocol" in `docs/method/process.md`
  as a repeatable, 4-phase synthesis workflow.
- Implemented a Model Context Protocol (MCP) server (`method mcp`) to
  expose METHOD tools to external agents programmatically.
- Extracted a clean, programmable `Method` API surface in `src/index.ts`,
  decoupling domain logic from CLI presentation.
- Standardized YAML frontmatter across all document classes (Design,
  Retro, Backlog, Signposts) with automated enforcement in the test
  suite.
- Refreshed `docs/VISION.md` with trusted provenance metadata and a
  source manifest covering eight completed cycles.
- Added a `drift` command to detect playback-question drift in active
  cycles.
- Added invariants as a first-class METHOD concept: named properties
  that must remain true across all cycles, defined in
  `docs/invariants/<name>.md`. Legends now exist to guard invariants,
  giving them a concrete job beyond organizing attention. This repo's
  four invariants: cycle-traceability, commitment-integrity,
  signpost-provenance, and signpost-boundedness.
- Added a minimal GitHub Actions CI gate that runs `npm ci`,
  `npm run build`, and `npm test` on `push` and `pull_request`, pinned
  to `ubuntu-24.04` with Node `22`.
- Raised the repo's Node support floor to `>=22` so the documented
  runtime contract matches the actual toolchain and CI behavior.
- Clarified the cycle loop so closeout happens on the branch, review
  happens against the full cycle packet, and ship sync happens on
  merged `main`.
- Added practical METHOD guidance in `docs/method/guide.md` and captured
  follow-on backlog notes for branch workflow policy and conversational
  retro closeout.
- Clarified METHOD doctrine and repo coordination: the README now makes
  reproducibility, accessibility, localization, agent explainability,
  disagreement handling, and forge-agnostic boundaries explicit.
- Added bounded repo signposts for direction and executive synthesis:
  `docs/BEARING.md` and `docs/VISION.md` now summarize repo state with
  source manifests and artifact-history provenance.
- Organized current work under the `PROCESS` and `SYNTH` legends, cleaned
  out stale backlog duplicates, and expanded docs tests to catch
  provenance drift, signpost-depth mistakes, path leaks, and legend
  hygiene regressions.
- Added `method drift [cycle]`, a deterministic first-cut detector that
  compares active-cycle playback questions against exact normalized test
  descriptions and reports unmatched questions with stable exit codes.
- Hardened `method drift` to ignore commented-out test calls, made the
  current `tests/`-only discovery scope explicit in help output, and
  tightened witness/test coverage around clean versus drift-found exit
  semantics.
- Tightened drift parser helpers so quoted test descriptions decode
  consistently across delimiters, removed unnecessary workspace setup
  from `help drift` test coverage, and made workspace detection tolerate
  clone-like repos with missing empty backlog lanes.
- Added the initial TypeScript `method` CLI using published Bijou packages.
- Implemented `init`, `inbox`, `pull`, `close`, and `status`.
- Fixed `method help <command>` so command-specific usage resolves correctly.
