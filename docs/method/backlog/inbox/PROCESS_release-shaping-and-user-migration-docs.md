# Release shaping and user migration docs

METHOD needs a clearer way to shape releases, not just cycles. Alongside
`CHANGELOG.md`, the repo should have a structured, user-facing release
surface that explains what is new in a release, why it matters, and how
to migrate from previous versions when migration is required.

Session context:

- The current release doctrine is intentionally light: `release.md`
  says releases happen when externally meaningful behavior changes and
  points at `CHANGELOG.md` plus `README.md`.
- That is enough for honesty, but it is not enough for user-facing
  release communication. Changelogs are ledger-like. Users often need a
  more guided document: what changed, what to look at first, what might
  break, and what to do next.
- The gap is especially visible for infrastructure repositories where a
  release may change doctrine, CLI behavior, file layout, or expected
  workflow. A terse changelog entry is not always the right surface for
  helping a user adopt that release.

Questions this should answer:

- What makes a release “shaped” rather than just tagged and logged?
- What artifact should accompany a real release besides
  `CHANGELOG.md`?
- Should METHOD define a user-facing release note format such as:
  summary, what changed, why it matters, breaking changes,
  migration/upgrade steps, and links to deeper docs?
- When should a release include explicit migration guidance versus “no
  migration required”?
- Where should these artifacts live: `docs/releases/`, a generated
  release page, versioned markdown files, or something else?
- How should release shaping relate to cycle closeout and post-merge
  ship sync?

What this surfaced:

- METHOD currently knows how to close cycles honestly, but not yet how
  to present releases coherently to users.
- `CHANGELOG.md` is necessary, but not always sufficient as the primary
  user-facing release document.
- A structured release note / migration surface could become part of the
  release method without turning every cycle into release theater.
