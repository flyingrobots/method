# Changelog

## Unreleased

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
- Added the initial TypeScript `method` CLI using published Bijou packages.
- Implemented `init`, `inbox`, `pull`, `close`, and `status`.
- Fixed `method help <command>` so command-specific usage resolves correctly.
