---
title: "METHOD - Executive Summary"
generated_at: 2026-04-09T07:33:48-07:00
generator: "manual synthesis following Executive Summary Protocol (Cycle 0013)"
generated_from_commit: "88c4f00129e96858ec08567243dfd4d165b79445"
provenance_level: artifact_history
witness_ref: docs/method/retro/0035-method-repo-self-discipline/witness/verification.md
source_files:
  - README.md
  - CHANGELOG.md
  - docs/BEARING.md
  - docs/releases/v1.0.0.md
  - docs/method/releases/v1.0.0/release.md
  - docs/method/process.md
  - docs/method/legends/PROCESS.md
  - docs/method/legends/SYNTH.md
  - docs/design/0001-method-cli/method-cli.md
  - docs/design/0002-playback-witness-convention/playback-witness-convention.md
  - docs/design/0003-readme-revision/readme-revision.md
  - docs/design/0004-readme-and-vision-refresh/readme-and-vision-refresh.md
  - docs/design/0005-drift-detector/drift-detector.md
  - docs/design/0006-ci-gates/ci-gates.md
  - docs/design/0007-cli-module-split/cli-module-split.md
  - docs/design/0008-release-shaping-and-user-migration-docs/release-shaping-and-user-migration-docs.md
  - docs/design/0009-generated-signpost-provenance/generated-signpost-provenance.md
  - docs/design/0010-yaml-frontmatter-schema/yaml-frontmatter-schema.md
  - docs/design/0011-library-api-surface/library-api-surface.md
  - docs/design/0012-mcp-server/mcp-server.md
  - docs/design/0013-executive-summary-protocol/executive-summary-protocol.md
  - docs/design/0014-github-issue-adapter/github-issue-adapter.md
  - docs/design/0015-git-branch-workflow-policy/git-branch-workflow-policy.md
  - docs/design/0016-system-style-javascript-adoption/system-style-javascript-adoption.md
  - docs/design/0017-behavior-spike-convention/behavior-spike-convention.md
  - docs/design/0018-ship-sync-automation/ship-sync-automation.md
  - docs/design/0019-config-management/config-management.md
  - docs/design/0020-automated-witness-capture/automated-witness-capture.md
  - docs/design/0021-two-way-github-sync/two-way-github-sync.md
  - docs/design/0022-method-consistency-fixes/method-consistency-fixes.md
  - docs/design/0023-drift-near-miss-hints/drift-near-miss-hints.md
  - docs/design/0024-async-exec-refactor/async-exec-refactor.md
  - docs/design/0025-configurable-workspace-paths/configurable-workspace-paths.md
  - docs/design/0030-backlog-metadata-single-source-of-truth/backlog-metadata-single-source-of-truth.md
  - docs/design/0031-generated-doc-scaffold-contract/generated-doc-scaffold-contract.md
  - docs/design/0032-mcp-tool-result-contract/mcp-tool-result-contract.md
  - docs/design/0033-bearing-truthfulness/bearing-truthfulness.md
  - docs/design/0034-review-state-query/review-state-query.md
  - docs/design/0035-method-repo-self-discipline/method-repo-self-discipline.md
---

# METHOD - Executive Summary

## Identity

METHOD is a calm development method for a repo shared by a human and an
agent. Its core claim is simple: keep the backlog in the filesystem,
work in small cycles, prove claims with rerunnable witnesses, and close
every cycle with a retro.

The repo is intentionally light on project-management ceremony. The
filesystem is the database, `ls` is the query, and signposts explain the
state of the system without replacing the underlying files.

## Current state

METHOD has evolved from doctrine plus a working CLI into a more complete
toolchain for human/agent repo operation. Thirty-five cycles are
closed, and no cycle packets are currently open on this branch:

- **Foundations (0001-0007):** Established the CLI, witness
  conventions, drift detection, CI gates, and a cleaner module split.
- **Release and provenance groundwork (0008-0013):** Formalized release
  shaping, generated-signpost provenance, a library-facing API surface,
  MCP support, and the executive-summary protocol.
- **Workflow and configuration hardening (0014-0025):** Added GitHub
  sync, branch doctrine, behavior spikes, ship sync, configuration
  management, automated witness capture, consistency fixes, near-miss
  drift hints, async exec, and configurable workspace paths.
- **Post-release maturity work (0026-0035):** Added OSS scaffolding,
  generated reference signposts, hybrid signpost generation, bad-code
  cleanup, frontmatter-first backlog metadata, scaffold contract
  alignment, MCP result contracts, truthful `BEARING` generation,
  native review-state, and a repo self-discipline cleanup that makes
  open cycle packets on `main` a documented defect instead of a tolerated
  exception.

The repo is organized under two legends:
- `PROCESS`: Workflow mechanics, adapters, and system architecture.
- `SYNTH`: Self-description, signposts, and provenance.

## Signposts

- **README.md:** Core doctrine and filesystem structure.
- **docs/BEARING.md:** Current priority, recent ships, and "felt" tensions.
- **docs/VISION.md:** Bounded executive synthesis (this document).

## Legends

### PROCESS
Covers cycle discipline, backlog movement, adapters (GitHub, MCP), and
named patterns (spikes, workflow).
- **Active:** None.
- **Backlog:** 38 items across inbox, up-next, cool-ideas, and bad-code.

### SYNTH
Covers repo self-description, signposts, and provenance level.
- **Active:** None.
- **Backlog:** 3 items in cool-ideas.

## Roadmap

### Active

- None.

### Up Next

- **PROCESS_live-legend-definition-coverage:** tighten the repo’s live
  legend definitions so signpost and backlog coverage stay aligned.

### Inbox
- **PROCESS_semantic-drift-detector:** LLM-based fuzzy matching for drift.
- **PROCESS_multi-forge-adapter:** GitLab/Bitbucket via common ForgeAdapter.
- **PROCESS_interactive-scaffolder:** Wizard for `method pull`.
- **PROCESS_i18n-string-extraction:** Centralize hardcoded English strings.
- **PROCESS_doctor-command:** a bounded diagnostic surface for repo truth
  and health.

### Cool Ideas
- **PROCESS_backlog-query-surface:** native structured query surface over
  backlog cards.
- **PROCESS_next-work-menu:** repo-native “what’s next?” recommendations
  with evidence and stats.
- **PROCESS_review-closeout-helper:** help map review findings to SHAs and
  close out threads systematically.
- **PROCESS_legend-audit-and-assignment:** First-class legend management.
- **PROCESS_retro-conversational-closeout:** CLI-guided retro prompts.
- **SYNTH_artifact-history-and-semantic-provenance:** Formal provenance split.
- **SYNTH_cycle-witness-command:** `method witness` command.

### Bad Code

- **PROCESS_generated-reference-sync-coupling:** scoped reference-doc
  refresh is still coupled to ship-level sync.
- **PROCESS_typed-frontmatter-access:** frontmatter access still erases
  useful structure by stringifying every YAML value.
- **PROCESS_mcp-runtime-input-validation-audit:** several mutation
  surfaces still need the same runtime-hardening pass recent review
  work exposed.

## Open questions

- Should review-state and review-closeout become a fuller native release
  cockpit, or stay as smaller bounded commands?
- Should `docs/VISION.md` remain manually synthesized, or is it time to
  land a native sync command for it?
- What is the smallest further guard that would have prevented the repo's
  own cycle-closeout sloppiness even earlier?

## Limits

This document is a bounded synthesis over repo-visible artifacts. It is
grounded in artifact history only. It does not claim semantic
provenance, observation lineage, or replay beyond the source surfaces
named in the frontmatter.
