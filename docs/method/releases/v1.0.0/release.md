---
title: "Release v1.0.0"
---

# Release v1.0.0

## Version Justification

`v1.0.0` is the right next release because METHOD now includes a real
breaking library API change: direct `Workspace.closeCycle(...)` callers
must supply an `outcome`. That change is externally meaningful and is
not hidden behind internal-only scaffolding, so a semver-major cut is
the honest boundary.

This release also raises the bar around the public surface instead of
only adding features. The repo now ships native review-state visibility,
harder MCP/runtime validation, and package metadata that constrains
packed artifacts to the built runtime instead of the whole working tree.
It also cleans up the repo’s own METHOD discipline so the maintainer
docs and tests stop treating open cycle packets on `main` as acceptable.

## Included Changes

- 0030: Backlog metadata became frontmatter-first for lane and legend
  truth.
- 0031: Generated design and retro scaffolds were aligned with the
  committed docs contract.
- 0032: MCP tools gained a stronger structured result contract.
- 0033: `BEARING.md` stopped making stale claims and now reflects live
  repo pressure more honestly.
- 0034: Native review-state landed across CLI and MCP and is now closed
  with an honest cycle packet.
- 0035: Repo self-discipline docs/tests now treat open cycle packets on
  `main` as stop-and-repair defects, remove tracked local tool junk, and
  tolerate legacy missing-title frontmatter on read.
- 0036: Witness capture now records the direct drift report instead of
  shelling out through a missing `tsx` binary and falling back to the
  empty drift placeholder.
- Merged PR #20: agent-first backlog and workflow follow-ons were
  recorded explicitly instead of staying tribal knowledge.
- Merged PR #17: dependency updates for `hono` and `@hono/node-server`.
- Release-prep hardening on this branch: package contents were narrowed
  to the built runtime and essential top-level metadata, and the
  publishable package name was scoped to `@flyingrobots/method`.

## Hills Advanced

- A developer or agent can ask METHOD what is under review and whether
  the current PR is merge-ready without reconstructing forge state by
  hand.
- The packed artifact is now intentionally small and excludes repo-local
  implementation sources, tests, and internal docs.
- Witness packets are now more trustworthy because the close flow
  records the actual drift report it observed instead of a silent empty
  fallback.
- Repo signposts and release surfaces are updated for the current
  post-`v0.3.0` state instead of pointing at an older maturity snapshot.
- The METHOD repo itself now documents and tests the rule that `main`
  should not carry open cycle packets as a tolerated exception.

## Affected Users

- Direct library consumers of `Workspace`.
- CLI and MCP operators who need review-state visibility.
- Maintainers preparing releases or sanity-checking the packed artifact.
- Consumers installing from npm, who should use the scoped package name
  `@flyingrobots/method`.
- Human/agent pairs relying on signposts to understand current repo
  state quickly.
- Maintainers of older METHOD repos whose docs may still be missing
  modern frontmatter fields such as `title`.

## Migration

Migration is required for any code that calls `Workspace.closeCycle(...)`
directly.

- Before: `await workspace.closeCycle('0033-bearing-truthfulness', true)`
- After: `await workspace.closeCycle('0033-bearing-truthfulness', true, 'hill-met')`

CLI and MCP operators do not need a migration for this specific change
because those surfaces already require explicit `outcome` values.

Older repos may also carry legacy METHOD documents with incomplete
frontmatter. This release tolerates a missing `title` by deriving it
from the first Markdown heading on read, but it does not claim to
auto-rewrite all legacy docs into the modern frontmatter contract.

## SemVer Impact

Major (`1.0.0`).

- Why not patch or minor: the direct library API break would make that
  dishonest.
- Why not `2.0.0`: this is the first semver-major boundary after the
  `0.3.0` public release, not a second-generation product reset.
