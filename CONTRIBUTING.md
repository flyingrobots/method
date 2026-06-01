# Contributing

METHOD welcomes contributions. This document explains how to
participate effectively.

## How METHOD Works

METHOD uses its own process to develop itself. Work happens in small,
numbered cycles. Each cycle has a design doc, tests, implementation,
and a retro. Read `README.md` for the full loop.

## Getting Started

```bash
git clone https://github.com/flyingrobots/method.git
cd method
npm install
npm run build
npm test
```

## Making Changes

1. **Start from GitHub Issues.** Work is tracked in repo-local GitHub
   Issues, not local backlog files. Use Method lane labels such as
   `lane:inbox`, `lane:asap`, `lane:bad-code`, and `lane:cool-ideas`.
2. **Normalize the issue title before starting.** Issue titles should be
   short, branch-safe, and contributor-readable.
3. **Mark active work.** Add `work-in-progress` when you start so other
   contributors and agents know the issue is claimed.
4. **Create a branch from the issue title slug** from `main`, for
   example `foo-feature-needs-external-bar-integration`.
5. **Follow the loop.** Design, RED, GREEN, playback, close, PR.
6. **Open a pull request** against `main` with the full Method evidence
   (design doc, tests, implementation, retro, witness).

## Code Style

- TypeScript with strict linting. Run `npm run build` before pushing.
- Tests are the spec. Write failing tests first.
- No `execSync` — use async APIs.
- See `ARCHITECTURE.md` for source layout.

## Commit Messages

Use conventional commits:

```
feat: add near-miss hints to drift detector
fix: resolve symlink in CLI entry point guard
test: RED — failing tests for async exec refactor
chore: ship sync for cycles 0022-0025
docs: update VISION.md for cycles 0001-0025
```

## What We Do Not Accept

- Changes without tests.
- PRs that skip the drift check.
- Modifications to existing tests to make failing code pass (fix the
  code, not the test).

## License

By contributing, you agree that your contributions will be licensed
under the Apache License 2.0.
