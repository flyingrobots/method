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
- Publishable unit: npm package named `method`
- Registry posture: publishable manifest; no package-level `private` guard
- Previous tag: `v0.3.0` -> `1955ec1cd9c067f03db76a13e626a53e6b298b9d`
- Prep branch: `maint-v1-0-0-release-prep`
- Base `main` head at prep start: `39cb47c572c1ddf6e89ea4aeca3b6ecba20863bd`
- Release-prep commit carrying the version bump and package hardening:
  `95610cb6817943db932b42934da120e08f6b1e23`

## Guards

- Clean working tree before release-prep edits: PASS
- Branch is `main`: NOT YET
- HEAD matches `origin/main`: NOT YET
- Tag signing required: no repo-local requirement discovered

## Validation

- Build (`npm run build`): PASS
- Tests (`npm test`): PASS, 175/175 tests across 15 files
- Pack dry-run (`npm pack --dry-run --json`): PASS,
  `method-1.0.0.tgz`, 35 files, 46,971 bytes packed / 180,928 bytes
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
