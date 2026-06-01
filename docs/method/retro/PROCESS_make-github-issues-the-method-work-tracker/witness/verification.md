---
title: "Verification Witness"
cycle: "PROCESS_make-github-issues-the-method-work-tracker"
---

# Verification Witness

## Scope

Cycle:
`PROCESS_make-github-issues-the-method-work-tracker`

Issue:
https://github.com/flyingrobots/method/issues/27

PR:
https://github.com/flyingrobots/method/pull/64

## Verification Commands

Run from the Method repository root:

```bash
npm audit --omit=dev
npm run lint
npm test
gh pr checks 64 --repo flyingrobots/method
```

## Expected Result

- `npm audit --omit=dev` reports zero production vulnerabilities.
- `npm run lint` passes.
- `npm test` passes.
- GitHub PR checks for PR #64 pass, apart from external reviewer status
  contexts that reflect review state rather than local code execution.

## Playback Evidence

- Human-facing docs identify GitHub Issues as the live tracker and repo
  files as the evidence ledger.
- Branch naming docs use issue-title slugs.
- Issue and PR templates require Method evidence links.
- Migration tooling preserves source-file provenance and fails closed on
  duplicate source markers.
- Migration tooling maps legacy `up-next` backlog cards to canonical
  `lane:asap` instead of creating `lane:up-next`.
- Migration tooling rejects unknown lanes instead of creating arbitrary
  `lane:*` labels.
- Migration tooling requires exact YAML frontmatter delimiters and keeps
  malformed YAML as raw markdown.
- Migration tooling parses `gh issue create` output defensively and
  aborts when no issue number can be recovered.
