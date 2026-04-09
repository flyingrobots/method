---
title: "v1.0.0 Release Verification"
---

# v1.0.0 Release Verification

## Scope

This packet records release-prep discovery and validation on
`maint-v1-0-0-release-prep`. Final tag, push, and GitHub Release
evidence must be completed from `main` after this prep branch lands.

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
- Current release-prep head after closing cycles `0034` and `0035`:
  `507dac54fdd37d80796f3ada3e35ab8692399f1c`

## Guards

- Clean working tree before release-prep edits: PASS
- Branch is `main`: NOT YET
- HEAD matches `origin/main`: NOT YET
- Tag signing required: no repo-local requirement discovered

## Validation

- Build (`npm run build`): PASS
- Tests (`npm test`): PASS, 182/182 tests across 16 files
- Pack dry-run (`npm pack --dry-run --json`): PASS,
  `flyingrobots-method-1.0.0.tgz`, 35 files, 47,359 bytes packed /
  182,250 bytes
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
- local tool files such as `.mcp.json` and `.claude/settings.local.json`
  are ignored rather than tracked
- the ad hoc `backfill_frontmatter.cjs` script is no longer a repo
  artifact

## Final Release Steps Pending

- Merge release prep to `main`
- Re-run guard checks from `main`
- Create the release commit if additional finalization is needed
- Create tag `v1.0.0`
- Push `main` and `v1.0.0`
- Create the GitHub Release using `docs/releases/v1.0.0.md`
- Verify downstream delivery directly

## Non-blocking Warnings

- Registry publication itself is still a separate operational step. This
  packet only proves the manifest is publishable and the packed artifact
  is intentionally slim.
- The unscoped npm package name `method` is already taken upstream, so
  this release is prepared for the scoped name `@flyingrobots/method`.
