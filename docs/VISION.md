---
title: "METHOD - Executive Summary"
generated_at: 2026-04-04T11:55:00-07:00
generator: "manual synthesis following Executive Summary Protocol (Cycle 0013)"
generated_from_commit: "8ea719437d23b9c1703b69390706fb4c8046e9a9"
provenance_level: artifact_history
witness_ref: docs/method/retro/0015-git-branch-workflow-policy/witness/verification.md
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
Fifteen cycles are already closed:

- **CLI Foundations (0001-0004, 0007):** Established the CLI, witness
  conventions, and separated the module structure.
- **Enforcement (0005-0006):** Added the `drift` command and CI gates.
- **Maturity (0008-0011):** Formalized releases, metadata contracts, and
  extracted a clean, programmable `Method` API.
- **Connectivity (0012, 0014):** Implemented an MCP server and a GitHub
  Issue synchronization adapter.
- **Workflow (0013, 0015):** Formalized the Executive Summary Protocol
  and Git branch/workflow doctrine.

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
- **Up-next:** `PROCESS_system-style-javascript-adoption`,
  `PROCESS_behavior-spike-convention`.

### SYNTH
Covers repo self-description, signposts, and provenance level.
- **Active:** None.
- **Up-next:** None.

## Roadmap

### Active
- None.

### Up-next
- **PROCESS_system-style-javascript-adoption:** Align internal
  architecture with the "System-Style JS" standard.
- **PROCESS_behavior-spike-convention:** Formalize how temporary
  spikes are documented and retired.

### Inbox
- None.

## Open questions

- Should METHOD support two-way synchronization with GitHub (comments)?
- How much automated assistance should the CLI provide for "Ship Sync"?
- Where is the line between a "Method Tool" and a "System Feature"?

## Limits

This document is a bounded synthesis over repo-visible artifacts. It is
grounded in artifact history only. It does not claim semantic
provenance, observation lineage, or replay beyond the source surfaces
named in the frontmatter.
