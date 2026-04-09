---
title: "Test Taxonomy And Fixture Drift"
legend: PROCESS
lane: bad-code
---

# Test Taxonomy And Fixture Drift

Several tests still seed obsolete legend codes like `PROTO`, `VIZ`,
`TUI`, and `FEAT`, and they create markdown fixtures that do not follow
the current frontmatter expectations. The committed docs suite, README,
and backlog conventions now claim a tighter live taxonomy than the tests
exercise.

That makes the suite partially validate an older METHOD than the one the
repo documents. Fixtures should either reflect the current doctrine or
be clearly marked as compatibility cases rather than silent drift.
