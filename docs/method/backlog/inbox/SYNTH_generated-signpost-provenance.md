# Generated Signpost Provenance

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
provenance.

| Field | Type | Required | Meaning |
|-------|------|----------|---------|
| `generated_at` | ISO 8601 string | yes | When the signpost was generated. |
| `generator` | string | yes | Who or what generated it. |
| `generated_from_commit` | git SHA string | yes | Repo state the summary is grounded in. |
| `provenance_level` | string | yes | Current provenance class, such as `artifact_history`. |
| `witness_ref` | relative path string | yes | Where the full session or verification witness lives. |
| `source_files` | array of relative path strings | yes | Source artifacts consulted during synthesis. |
| `read_order_version` | string | no | Version of the synthesis read-order convention. |
| `origin_request` | object | no | Triggering request or caller metadata. |
| `metadata` | object | no | Extra repo-local fields that do not change the baseline contract. |

Example:

```json
{
  "generated_at": "2026-04-02T17:41:54-07:00",
  "generator": "manual synthesis during cycle 0004-readme-and-vision-refresh",
  "generated_from_commit": "0e7b57a33c44500b9720502e3bb5bac7b3d58c10",
  "provenance_level": "artifact_history",
  "witness_ref": "docs/method/retro/0004-readme-and-vision-refresh/witness/verification.md",
  "source_files": [
    "README.md",
    "docs/BEARING.md",
    "docs/method/process.md"
  ],
  "read_order_version": "1"
}
```

The full session witness should be linked by `witness_ref`, not dumped
into the signpost body.

What this surfaced:

- Generated signposts need a bounded provenance contract.
- Full session context is valuable, but should probably live in a
  linked witness or provenance artifact rather than bloating the
  signpost body.
- METHOD should define which provenance fields are mandatory and which
  are optional for generated docs.
