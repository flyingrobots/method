---
title: "Generated Signpost Provenance"
legend: SYNTH
---

Source backlog item: `docs/method/backlog/asap/SYNTH_generated-signpost-provenance.md`


## Sponsors

- Human: @james
- Agent: @gemini-cli

## Hill

Define and enforce a standard YAML frontmatter provenance contract for
generated METHOD signposts, then use it to refresh `docs/VISION.md` so
it accurately reflects the state of the repo after eight closed
cycles.

## Playback Questions

### Human

- [ ] `docs/VISION.md` carries YAML frontmatter matching the defined
  provenance contract.
- [ ] The `generator` field identifies this cycle `0009`.
- [ ] `docs/VISION.md` summary is accurate for the current closed-cycle
  state (cycles 0001-0008).

### Agent

- [ ] `docs.test.ts` validates that `docs/VISION.md` frontmatter
  contains all mandatory fields (`generated_at`, `generator`,
  `generated_from_commit`, `provenance_level`, `witness_ref`,
  `source_files`).
- [ ] `docs.test.ts` validates that the `witness_ref` path exists
  relative to the repo root.
- [ ] `docs.test.ts` validates that `generated_at` is a valid ISO 8601
  timestamp.

## Accessibility and Assistive Reading

- Linear truth / reduced-complexity posture: YAML frontmatter provides
  a structured, predictable header that does not interfere with the
  markdown body's readability.
- Non-visual or alternate-reading expectations: Semantic tags in the
  YAML frontmatter (e.g., `witness_ref`) make it easy for screen
  readers or agents to find supporting evidence without parsing the
  body.

## Localization and Directionality

- Locale / wording / formatting assumptions: `generated_at` uses ISO
  8601 for a locale-agnostic timestamp.
- Logical direction / layout assumptions: Top-level frontmatter is a
  standard markdown convention.

## Agent Inspectability and Explainability

- What must be explicit and deterministic for agents: The source files
  and grounding commit for the synthesis must be explicit.
- What must be attributable, evidenced, or governed: The link to the
  session witness (`witness_ref`) provides the "why" and "how" behind
  the synthesis.

## Non-goals

- [ ] Standardizing frontmatter for *all* METHOD docs (only generated
  signposts for now).
- [ ] Automating the generation of this frontmatter (this cycle is about
  the contract and enforcement).

## Backlog Context

Generated signposts need provenance. Define what metadata a generated VISION/summary doc should carry: generation time, commit, source files, read-order version, origin request, and where the full session witness lives. The signpost should stay readable; the full session context should live in a linked witness artifact, not dumped inline by default.

Session context:

- In `graft`, the first generated `VISION.md` was immediately revised to
  add YAML frontmatter, source links, and a full appendix containing the
  text of every backlog item.
- The follow-up ask was not just "make it nicer." It was "make the
  generated signpost carry enough provenance that the synthesis can be
  trusted and revisited."

## Provenance Contract

Generated summary signposts should carry explicit frontmatter. The
baseline METHOD contract is artifact-history level, not semantic
provenance. For markdown signposts, the reference rendering is YAML
frontmatter.

| Field | Type | Required | Meaning |
|-------|------|----------|---------|
| `generated_at` | full ISO 8601 timestamp with timezone | yes | When the signpost was generated. |
| `generator` | string | yes | Who or what generated it. |
| `generated_from_commit` | git SHA string | yes | Repo state the summary is grounded in. |
| `provenance_level` | string | yes | Current provenance class, such as `artifact_history`. |
| `witness_ref` | relative path string | yes | Where the full session or verification witness lives. |
| `source_files` | array of relative path strings | yes | Source artifacts consulted during synthesis. |
| `read_order_version` | string | no | Version of the synthesis read-order convention. |
| `origin_request` | object | no | Triggering request or caller metadata. |
| `metadata` | object | no | Extra repo-local fields that do not change the baseline contract. |

Example (YAML frontmatter format):

```yaml
generated_at: 2026-04-02T17:41:54-07:00
generator: "manual synthesis during cycle 0004-readme-and-vision-refresh"
generated_from_commit: "0e7b57a33c44500b9720502e3bb5bac7b3d58c10"
provenance_level: artifact_history
witness_ref: docs/method/retro/0004-readme-and-vision-refresh/witness/verification.md
source_files:
  - README.md
  - docs/BEARING.md
  - docs/method/process.md
read_order_version: "1"
```

The full session witness should be linked by `witness_ref`, not dumped
into the signpost body.

What this surfaced:

- Generated signposts need a bounded provenance contract.
- Full session context is valuable, but should probably live in a
  linked witness or provenance artifact rather than bloating the
  signpost body.
- METHOD now defines which provenance fields are mandatory and which
  are optional for generated docs via the contract table above.
