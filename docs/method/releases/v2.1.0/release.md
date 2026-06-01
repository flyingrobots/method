---
title: "v2.1.0 Release Packet"
---

# v2.1.0 Release Packet

## Summary

METHOD v2.1.0 ships GitHub Issues as the canonical live work tracker,
keeps repository files as the durable evidence ledger, and adds migration
tooling for converting legacy filesystem backlog lanes into GitHub
Issues.

## Included Work

- PR #64: Make GitHub Issues the Method work tracker.
- PR #66: Tighten issue templates around sponsored perspectives,
  witness plans, and Method artifact links.
- Dependency lockfile cleanup that resolved all open GitHub Dependabot
  alerts for the Method repository.

## Hill

As an OSS contributor and agent collaborator, I can discover, start,
track, and close Method work through GitHub Issues while Method design
docs, witnesses, playbacks, retros, and release evidence remain durable
repo artifacts.

## Sponsored Perspectives

- Sponsored Human: OSS contributor or maintainer who needs a familiar
  issue tracker without losing Method's evidence discipline.
- Sponsored Agent: Review, migration, and implementation agents that
  need deterministic issue labels, branch naming, and artifact links.

## Version Justification

This is a minor release. It changes externally visible workflow,
templates, docs, and migration tooling, but it does not intentionally
break the TypeScript runtime API or CLI command contract.

## Scope

### Added

- GitHub Issue templates for work items, bugs, and spikes.
- Pull request template tying GitHub Issues to Method evidence.
- `npm run migrate` / `scripts/migrate-backlog-to-github-issues.mjs`
  for migrating legacy backlog lanes into GitHub Issues.
- Migration archive for Method's own former live backlog cards.
- Release-facing tests for migration idempotency, canonical labels,
  path normalization, parser behavior, and issue creation guards.

### Changed

- Doctrine now treats GitHub Issues as the live tracker and repo files as
  the evidence ledger.
- Branch naming now uses linked issue-title slugs.
- Legacy filesystem backlog commands are documented as compatibility and
  migration surfaces rather than the new authority model.
- Issue templates now require abstract sponsored perspectives, explicit
  witness plans, and Method artifact links.

### Fixed

- Production dependency alerts from the previous default branch state are
  fixed in `package-lock.json`.
- Migration now fails closed on duplicate source markers, unknown lanes,
  malformed issue-create output, and incomplete existing-issue loading.
- Legacy `up-next` backlog cards map to canonical `lane:asap` instead of
  creating `lane:up-next`.

## Migration Guidance

No runtime migration is required for existing package consumers.

Repository operators adopting this Method version should:

1. Use GitHub Issues as the live work tracker.
2. Use labels for lanes, legends, priorities, types, and active-work
   state.
3. Preserve design docs, witnesses, retros, and release packets in the
   repository.
4. Run `npm run migrate -- --repo OWNER/REPO` only after reviewing the
   migration output and GitHub issue state.

## Release Gate

This release is ready for tag and GitHub release after validation passes.
Npm publication is blocked until an authenticated npm session can verify
or publish `@flyingrobots/method`.
