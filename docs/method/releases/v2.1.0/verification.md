---
title: "v2.1.0 Verification"
---

# v2.1.0 Verification

## Discovery

- Repository type: TypeScript / Node.js package.
- Package manager: npm with `package-lock.json` as lockfile authority.
- Version manifests: `package.json`, `package-lock.json`.
- Publishable unit: `@flyingrobots/method` npm package.
- Previous tag: `v2.0.0`.
- Target tag: `v2.1.0`.
- Current release branch: `release-method-v2.1.0`.

## Pre-flight Evidence

Commands run before preparing release files:

```bash
git status -sb
npm audit --json
gh api 'repos/flyingrobots/method/dependabot/alerts?state=open' --paginate --jq 'length'
npm run method -- doctor
npm run method -- status
npm pack --dry-run --json
```

Observed results:

- Local `main` was clean and synced with `origin/main` before the release
  branch was created.
- `npm audit` reported zero vulnerabilities.
- GitHub Dependabot open alerts returned `0`.
- `method doctor` reported `Status: ok (0 errors, 0 warnings)`.
- `method status` reported no active cycles and no live backlog cards.
- `npm pack --dry-run --json` produced a publishable package artifact.

## Registry Visibility

The current package manifest names `@flyingrobots/method`.
Unauthenticated public npm lookup returned 404 for that scoped package:

```bash
npm view @flyingrobots/method version
```

The unscoped public package `method@2.0.0` exists, but it belongs to a
different repository and maintainer:

```text
name: method
repository: https://github.com/Gozala/method.git
maintainer: gozala <rfobic@gmail.com>
```

`npm whoami` returned `E401 Unauthorized`, so npm publication and direct
registry verification are blocked until npm auth is restored.

## Validation Checklist

The release-prep branch passed these commands before tagging:

```bash
npm run method -- doctor
npm audit --omit=dev
npm run lint
npm run build
npm test
npm pack --dry-run
```

Observed results:

- `npm run method -- doctor`: `Status: ok (0 errors, 0 warnings)`.
- `npm audit --omit=dev`: `found 0 vulnerabilities`.
- `npm run lint`: Biome checked 42 files with no fixes applied.
- `npm run build`: TypeScript build completed.
- `npm test`: 23 test files passed, 317 tests passed.
- `npm pack --dry-run`: produced `flyingrobots-method-2.1.0.tgz`
  for `@flyingrobots/method@2.1.0` with 43 files.

## Tag / Publish Evidence

Pending. Do not tag `v2.1.0` or publish until npm auth and package
visibility are resolved.
