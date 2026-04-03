# Changelog

## Unreleased

- Clarified legend coverage opt-in behavior and generated-signpost
  provenance wording, and expanded docs tests to catch cross-platform
  personal path leaks and empty-legend failures more clearly.
- Sorted the METHOD backlog under the `PROCESS` and `SYNTH` legends and
  added legend docs for both domains.
- Added `docs/VISION.md` as a bounded executive summary signpost with
  generation metadata and a source manifest.
- Extended docs tests to preserve the current legend split and keep the
  README, `docs/BEARING.md`, and `docs/VISION.md` truthful to the repo.
- Revised the README structure around stances, design constraints,
  quality gates, disagreement handling, and coordination.
- Added `docs/BEARING.md` as a bounded coordination signpost.
- Strengthened METHOD doctrine so non-reproducible witness artifacts do
  not satisfy done.
- Added the initial TypeScript `method` CLI using published Bijou packages.
- Implemented `init`, `inbox`, `pull`, `close`, and `status`.
- Fixed `method help <command>` so command-specific usage resolves correctly.
- Elevated accessibility, localization, and agent explainability into
  METHOD doctrine and the generated design-doc template.
