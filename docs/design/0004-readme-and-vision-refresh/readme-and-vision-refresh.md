---
title: "README And VISION Refresh"
legend: SYNTH
---

Source backlog item: `docs/method/backlog/asap/SYNTH_readme-and-vision-refresh.md`


## Sponsors

- Human: I can read the root signposts and understand what METHOD is,
  what domains currently organize its backlog, and what the repo is
  actually working toward.
- Agent: I can inspect the README and `docs/VISION.md` as trustworthy
  repo surfaces, with enough metadata and source grounding to rerun or
  challenge the synthesis.

## Hill

METHOD's root signposts become coherent and current: README reflects the
new legend structure and generated-signpost posture, and `docs/VISION.md`
gives a bounded, reproducible synthesis of the repo's current identity,
state, domains, backlog, and open tensions.

## Playback Questions

### Human

- [ ] Can I scan the refreshed README and understand the current
      legends, signposts, and backlog shape without inferring them from
      stale prose?
- [ ] Does `docs/VISION.md` give me a useful repo-level picture without
      turning into a dump of every file in the repository?

### Agent

- [ ] Can I inspect `docs/VISION.md` and tell when it was generated,
      what it was derived from, and what class of truth it is claiming?
- [ ] Do the README and `docs/VISION.md` make claims that are
      mechanically checkable from repo-visible files and commands?

## Accessibility and Assistive Reading

- Both signposts must remain legible as plain Markdown in a linear
  reader. Tables may help scanning, but the narrative must still make
  sense without them.
- `docs/VISION.md` should prefer concise sections and source references
  over dense formatting or layout-heavy summaries.

## Localization and Directionality

- Keep headings short and literal so the signposts could be localized
  later without restructuring the whole document.
- Use purpose-based artifact names and references, not left/right or
  other direction-bound labels.

## Agent Inspectability and Explainability

- `docs/VISION.md` should carry bounded frontmatter that names when it
  was generated, from what repo state, and which source surfaces it
  summarizes.
- The signposts must not pretend to have semantic provenance they do
  not yet carry. They should be explicit about artifact-history-level
  grounding only.

## Non-goals

- [ ] Implementing the executive-summary generator itself in this
      cycle. This cycle only dogfoods the shape manually.
- [ ] Solving artifact history or semantic provenance in tooling.
- [ ] Reclassifying backlog items again after the new legend split.
- [ ] Turning `docs/VISION.md` into an exhaustive appendix dump.

## Decisions To Make

- How the README should acknowledge the current legends and root
  signposts without becoming a changelog.
- What minimum frontmatter and source notes `docs/VISION.md` should
  carry.
- How much repo state belongs in `docs/VISION.md` before it stops being
  a useful signpost.
- Which parts of the signpost should be enforced by docs tests.

## Backlog Context

Refresh METHOD's signposts around the newly sorted legends. Update
README so it reflects the current legend structure and
generated-signpost posture truthfully, and generate a
`docs/VISION.md` signpost for the METHOD repo itself with reproducible
sources and bounded frontmatter.
