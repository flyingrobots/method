# Changelog

## Unreleased

- Added invariants as a first-class METHOD concept: named properties
  that must remain true across all cycles, defined in
  `docs/invariants/<name>.md`. Legends now exist to guard invariants,
  giving them a concrete job beyond organizing attention. This repo's
  four invariants: cycle-traceability, commitment-integrity,
  signpost-provenance, and signpost-boundedness.
- Added a minimal GitHub Actions CI gate that runs `npm ci`,
  `npm run build`, and `npm test` on `push` and `pull_request`, pinned
  to `ubuntu-24.04` with Node `22`.
- Raised the repo's Node support floor to `>=22` so the documented
  runtime contract matches the actual toolchain and CI behavior.
- Clarified the cycle loop so closeout happens on the branch, review
  happens against the full cycle packet, and ship sync happens on
  merged `main`.
- Added practical METHOD guidance in `docs/method/guide.md` and captured
  follow-on backlog notes for branch workflow policy and conversational
  retro closeout.
- Clarified METHOD doctrine and repo coordination: the README now makes
  reproducibility, accessibility, localization, agent explainability,
  disagreement handling, and forge-agnostic boundaries explicit.
- Added bounded repo signposts for direction and executive synthesis:
  `docs/BEARING.md` and `docs/VISION.md` now summarize repo state with
  source manifests and artifact-history provenance.
- Organized current work under the `PROCESS` and `SYNTH` legends, cleaned
  out stale backlog duplicates, and expanded docs tests to catch
  provenance drift, signpost-depth mistakes, path leaks, and legend
  hygiene regressions.
- Added `method drift [cycle]`, a deterministic first-cut detector that
  compares active-cycle playback questions against exact normalized test
  descriptions and reports unmatched questions with stable exit codes.
- Hardened `method drift` to ignore commented-out test calls, made the
  current `tests/`-only discovery scope explicit in help output, and
  tightened witness/test coverage around clean versus drift-found exit
  semantics.
- Tightened drift parser helpers so quoted test descriptions decode
  consistently across delimiters, removed unnecessary workspace setup
  from `help drift` test coverage, and made workspace detection tolerate
  clone-like repos with missing empty backlog lanes.
- Added the initial TypeScript `method` CLI using published Bijou packages.
- Implemented `init`, `inbox`, `pull`, `close`, and `status`.
- Fixed `method help <command>` so command-specific usage resolves correctly.
