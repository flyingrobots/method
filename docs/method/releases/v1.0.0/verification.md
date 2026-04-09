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
- Registry posture: packable, still intentionally `"private": true`
- Previous tag: `v0.3.0` -> `1955ec1cd9c067f03db76a13e626a53e6b298b9d`
- Prep branch: `maint-v1-0-0-release-prep`
- Base `main` head at prep start: `39cb47c572c1ddf6e89ea4aeca3b6ecba20863bd`

## Guards

- Clean working tree before release-prep edits: PASS
- Branch is `main`: NOT YET
- HEAD matches `origin/main`: NOT YET
- Tag signing required: no repo-local requirement discovered

## Validation

- Build (`npm run build`): PENDING
- Tests (`npm test`): PENDING
- Pack dry-run (`npm pack --dry-run --json`): PENDING
- Audit (`npm audit`): PENDING

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

## Final Release Steps Pending

- Merge release prep to `main`
- Re-run guard checks from `main`
- Create the release commit if additional finalization is needed
- Create tag `v1.0.0`
- Push `main` and `v1.0.0`
- Create the GitHub Release using `docs/releases/v1.0.0.md`
- Verify downstream delivery directly

## Non-blocking Warnings

- The package remains `"private": true`, so this release packet does not
  claim npm publication.
