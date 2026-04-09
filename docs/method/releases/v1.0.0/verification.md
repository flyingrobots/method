---
title: "v1.0.0 Release Verification"
---

# v1.0.0 Release Verification

## Scope

This packet records release-prep discovery plus final pre-tag validation
on `main`. Final tag and GitHub Release evidence must be completed after
the release commit is pushed.

## Discovery

- Repository type: TypeScript (ESM)
- Package manager: npm (`package-lock.json`)
- Version manifests: `package.json`, `package-lock.json`
- Publishable unit: npm package named `@flyingrobots/method`
- Registry posture: publishable manifest; no package-level `private` guard
- Previous tag: `v0.3.0` -> `1955ec1cd9c067f03db76a13e626a53e6b298b9d`
- Prep branch: `maint-v1-0-0-release-prep`
- Base `main` head at prep start: `39cb47c572c1ddf6e89ea4aeca3b6ecba20863bd`
- Release-prep commit carrying the version bump and package hardening:
  `95610cb6817943db932b42934da120e08f6b1e23`
- Main head after merging cycle `0036-witness-drift-output-capture` and
  refreshing release surfaces:
  `8a80012d1e9e5ee8cd00cb473072e1c822af9b22`

## Guards

- Clean working tree before release-prep edits: PASS
- Branch is `main`: PASS
- HEAD matches `origin/main`: PASS
- Tag signing required: no repo-local requirement discovered

## Validation

- Build (`npm run build`): PASS
- Tests (`npm test`): PASS, 183/183 tests across 16 files
- Pack dry-run (`npm pack --dry-run --json`): PASS,
  `flyingrobots-method-1.0.0.tgz`, 35 files, 47,459 bytes packed /
  182,548 bytes
  unpacked
- Audit (`npm audit`): PASS, 0 vulnerabilities
- Diff whitespace check (`git diff --check`): PASS

## Packaging Expectations

The `v1.0.0` package should include:

- compiled runtime files under `dist/`
- declaration files under `dist/`
- `README.md`
- `CHANGELOG.md`
- `LICENSE`
- `NOTICE`
- `package.json`

It should exclude:

- `src/`
- `tests/`
- `docs/`
- local tool metadata such as `.mcp.json` or editor settings
- TypeScript source maps unless intentionally added later

Observed exclusions during dry-run:

- no `src/` files
- no `tests/` files
- no `docs/` files
- no dotfiles
- no `.map` files

Observed release-prep cleanup state:

- no active cycle packets remain open on this branch
- cycle `0036-witness-drift-output-capture` is now closed and included
  in the release scope
- local tool files such as `.mcp.json` and `.claude/settings.local.json`
  are ignored rather than tracked
- the ad hoc `backfill_frontmatter.cjs` script is no longer a repo
  artifact

## Final Release Steps Pending

- None for the GitHub/source release.
- npm publication remains intentionally deferred.

## Release Evidence

- Release commit on `main`:
  `ddd55c33ef47b903f9b8744fb5b394d567bcd01d`
- Release tag:
  `v1.0.0` -> `ddd55c33ef47b903f9b8744fb5b394d567bcd01d`
- GitHub Release:
  `https://github.com/flyingrobots/method/releases/tag/v1.0.0`
- GitHub Release published at:
  `2026-04-09T21:34:08Z`
- Release-commit CI:
  `CI` run `24214431980` passed for
  `ddd55c33ef47b903f9b8744fb5b394d567bcd01d`
  at `https://github.com/flyingrobots/method/actions/runs/24214431980`
- Final witness update recorded from local `main` at:
  `2026-04-09T14:34:18-07:00`

## Non-blocking Warnings

- Registry publication itself is still a separate operational step. This
  packet only proves the manifest is publishable and the packed artifact
  is intentionally slim.
- The unscoped npm package name `method` is already taken upstream, so
  this release is prepared for the scoped name `@flyingrobots/method`.
