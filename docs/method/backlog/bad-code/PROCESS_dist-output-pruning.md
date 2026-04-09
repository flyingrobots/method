---
title: "Dist Output Pruning"
legend: PROCESS
lane: bad-code
---

# Dist Output Pruning

Build output can retain stale artifacts after source modules are
removed, renamed, or split across refactors. That drift makes the
published `dist/` tree a misleading projection of the live source tree.

This is bad code because published artifacts stop being a trustworthy
projection of current source.

## Proposed Solution

Option 1 (preferred): clean before emit.

- Update the `package.json` build path to remove `dist/` before `tsc`
  runs so every build starts from repo truth.
- Keep the clean step in the same build path humans and CI use, rather
  than relying on a separate manual command.

Option 2: validate `dist/` against source.

- Add a validation script that checks `dist/**/*.js` and
  `dist/**/*.d.ts` against the current `src/**/*.ts` module set.
- Run that validation in CI and release pre-flight so stale checked-in
  artifacts fail loudly instead of shipping quietly.

## Owner

- Human: Repository operator maintaining release and CI behavior.
- Agent: Implementation agent tightening the build path.

## Priority

Medium. This affects artifact truth and release hygiene, even when
runtime behavior happens to stay green.

## Acceptance Criteria

- [ ] The standard build path removes stale `dist/` artifacts before
      emit or proves they are current.
- [ ] CI or release pre-flight fails when `dist/` no longer matches the
      live `src/` module set.
- [ ] The chosen build/validation path is documented in the relevant
      operator docs.
