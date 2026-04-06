---
title: "METHOD - Executive Summary"
generated_at: 2026-04-04T22:35:00-07:00
generator: "manual synthesis following Executive Summary Protocol (Cycle 0013)"
generated_from_commit: "921706b9fc9fd5c7cf78331bdd0f3f91013ea558"
provenance_level: artifact_history
witness_ref: docs/method/retro/0021-two-way-github-sync/witness/verification.md
source_files:
  - README.md
  - CHANGELOG.md
  - docs/BEARING.md
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

METHOD has evolved from pure doctrine into a formal, programmable system.
Twenty-one cycles are already closed:

- **CLI Foundations (0001-0004, 0007):** Established the CLI, witness
  conventions, and separated the module structure.
- **Enforcement (0005-0006):** Added the `drift` command and CI gates.
- **Maturity (0008-0011, 0016, 0019):** Formalized releases, metadata
  contracts, extracted a clean API, adopted System-Style JS, and
  implemented a formal configuration system.
- **Connectivity (0012, 0014, 0021):** Implemented an MCP server and full
  two-way GitHub Issue synchronization.
- **Workflow (0013, 0015, 0017-0018, 0020):** Formalized the Executive
  Summary Protocol, Git branch doctrine, Behavior Spikes, Ship Sync
  automation, and Automated Witness Capture.

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
- **Up-next:** `PROCESS_i18n-string-extraction`.

### SYNTH
Covers repo self-description, signposts, and provenance level.
- **Active:** None.
- **Up-next:** None.

## Roadmap

### Active
- None.

### Up-next
- **PROCESS_i18n-string-extraction:** Extract hardcoded English strings into
  a centralized messages file.

### Inbox
- None.

## Open questions

- Should METHOD support visual screenshot capture in witnesses?
- How much domain logic should move from `src/index.ts` to legend-specific
  adapters?

## Limits

This document is a bounded synthesis over repo-visible artifacts. It is
grounded in artifact history only. It does not claim semantic
provenance, observation lineage, or replay beyond the source surfaces
named in the frontmatter.
