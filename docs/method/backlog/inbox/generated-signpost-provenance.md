# Generated Signpost Provenance

Generated signposts need provenance. Define what metadata a generated VISION/summary doc should carry: generation time, commit, source files, read-order version, origin request, and where the full session witness lives. The signpost should stay readable; the full session context should live in a linked witness artifact, not dumped inline by default.

Session context:

- In `graft`, the first generated `VISION.md` was immediately revised to
  add YAML frontmatter, source links, and a full appendix containing the
  text of every backlog item.
- The follow-up ask was not just "make it nicer." It was "make the
  generated signpost carry enough provenance that the synthesis can be
  trusted and revisited."

What this surfaced:

- Generated signposts need a bounded provenance contract.
- Full session context is valuable, but should probably live in a
  linked witness or provenance artifact rather than bloating the
  signpost body.
- METHOD should define which provenance fields are mandatory and which
  are optional for generated docs.
