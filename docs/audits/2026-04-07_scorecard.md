---
title: "Pre-Release Audit Scorecard"
generated_at: 2026-04-07T07:40:00Z
generated_from_commit: "b198467"
---

# Pre-Release Audit Scorecard

**Date:** 2026-04-07
**Target:** v0.3.0
**Commit:** `b198467`

---

## Overall Verdict

| Metric | Score | Status |
|--------|-------|--------|
| **Ship Decision** | **YES, BUT** | Fix shell injection + captureIdea frontmatter before tagging |
| **Developer Experience** | 6/10 | Functional, needs quickstart docs |
| **Internal Quality** | 5/10 | God class and manual YAML parsing are real risks |
| **Combined Health** | 6/10 | Well-tested, works end-to-end, architectural debt is bounded |

---

## Codebase Metrics

| Metric | Value |
|--------|-------|
| Source lines (src/) | 2,420 |
| Test lines (tests/) | 2,435 |
| Test/source ratio | 1.01:1 |
| Test files | 12 |
| Tests passing | 127/127 |
| Cycles closed | 28 |
| Commits | 149 |
| Runtime dependencies | 5 |
| Dev dependencies | 4 |
| Known vulnerabilities | 0 |

---

## Backlog Health

| Lane | Count | Items |
|------|-------|-------|
| **bad-code** | 6 | shell injection, manual YAML, captureIdea frontmatter, god class, no depth limit, unvalidated API responses |
| **inbox** | 5 | doctor command, i18n, interactive scaffolder, multi-forge adapter, semantic drift detector |
| **cool-ideas** | 9 | command registry, getting started guide, filesystem abstraction, CI hardening, legend audit, retro closeout, review config, artifact provenance, witness command |
| **asap** | 0 | — |
| **up-next** | 0 | — |

---

## Audit Findings Summary

### Audit 001: DX & Architecture

| Finding | Severity | Status |
|---------|----------|--------|
| No quickstart / getting-started docs | Medium | Backlogged (cool-ideas) |
| `sync github` defaults to push without confirmation | Medium | Backlogged |
| `ensureInitialized` error leaks absolute path | Low | Noted |
| Workspace god class (854 lines) | High | Backlogged (bad-code) |
| Manual YAML frontmatter parsing | High | Backlogged (bad-code) |
| No filesystem abstraction | Medium | Backlogged (cool-ideas) |
| Shell injection in execCommand | **Critical** | Partially fixed (git path uses plumbing; exec path remains) |
| Repeated directory walks in status() | Low | Noted |

### Audit 002: Documentation & README

| Finding | Severity | Status |
|---------|----------|--------|
| README missing quickstart section | Medium | Backlogged |
| README missing configuration section | Medium | Backlogged |
| No CODE_OF_CONDUCT.md | Low | Not yet created |
| .method.json undocumented in README | Medium | Backlogged |
| No end-to-end tutorial | Medium | Backlogged (cool-ideas) |

### Audit 003: Ready-to-Ship

| Finding | Severity | Status |
|---------|----------|--------|
| Shell injection via exec() for npm/tsx commands | **High** | Open — exec path still uses shell |
| No MCP workspace path validation | High | Open |
| captureIdea creates files without frontmatter | Medium | Backlogged (bad-code) |
| .method.json not in .gitignore template | Medium | Open |
| GitHub API responses unvalidated (any casts) | Medium | Backlogged (bad-code) |
| No npm audit in CI | Low | Backlogged (cool-ideas) |
| No lint step in CI | Low | Backlogged (cool-ideas) |

---

## Ship-Blocking Items (must fix for v0.3.0)

1. **Shell injection in execCommand** — `exec()` still passes
   `npm test` and `tsx src/cli.ts drift ${name}` through a shell.
   The git path is fixed (plumbing), but the test/drift commands
   are still vulnerable to directory names with shell metacharacters.

2. **captureIdea missing frontmatter** — every `method inbox` call
   creates a file that immediately fails the docs test suite. This
   is a first-use bug.

## Recommended Pre-Release (not blocking, but embarrassing)

3. **Add .method.json to .gitignore template** — prevents accidental
   token commits on init.

4. **MCP workspace path validation** — currently accepts any string
   including `/etc/passwd`.

---

## Signpost Inventory

| Signpost | Generated | Current |
|----------|-----------|---------|
| README.md | No | Hand-authored |
| ARCHITECTURE.md | Hybrid | 3 generated sections |
| docs/BEARING.md | Yes | Last sync: 2026-04-07 |
| docs/VISION.md | Yes | Last regen: 2026-04-06 (stale — needs 0026-0028) |
| docs/CLI.md | Hybrid | 1 generated section |
| docs/MCP.md | Hybrid | 1 generated section |
| docs/GUIDE.md | Hybrid | 1 generated section |
