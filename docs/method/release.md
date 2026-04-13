# Release

Releases happen when externally meaningful behavior changes.

## Shaped Release

A shaped release is not just a tag plus a changelog edit. It is a
deliberate packet that says what is shipping, why this version number is
correct, which users benefit, and what they need to do next.

Required release artifacts:

- `docs/method/releases/vX.Y.Z/release.md`
  Internal release design and acceptance packet. It defines:
  - included shipped cycles or externally meaningful changes
  - hills advanced by the release
  - sponsored users affected and how they are helped
  - why this exact version number is justified
  - whether migration guidance is required
- `docs/method/releases/vX.Y.Z/verification.md`
  Internal release witness. It records discovery, pre-flight
  validation, tag/publish evidence, and direct verification of delivery.
- `docs/releases/vX.Y.Z.md`
  User-facing release notes and migration guide.
- `CHANGELOG.md`
  Historical ledger of externally meaningful behavior.

`CHANGELOG.md` remains the ledger. The user-facing guided release
surface lives in `docs/releases/`.

## Scope

Releases aggregate shipped work. Release truth still lives in
`docs/method/releases/vX.Y.Z/`, `docs/releases/vX.Y.Z.md`, and
`CHANGELOG.md`.

A repo may use a backlog lane such as `docs/method/backlog/v1.1.0/` as
the primary planning bucket for a release. That is a good way to keep
release scope legible in the backlog.

Release lanes are still planning input, not release truth. Creating or
filling that lane does not declare the release accepted, does not
guarantee that every item in the lane ships together, and does not
replace the release packet or user-facing release notes.

When work is pulled from a release lane, the cycle packet may live under
`docs/releases/vX.Y.Z/design/<cycle>/` and
`docs/releases/vX.Y.Z/retros/<cycle>/` so the filesystem keeps release
scope and cycle evidence adjacent. If an item is temporarily promoted to
`asap/`, durable `release:` metadata should preserve that release
association.

The release design names and justifies the intended version before
tagging. Commit history, diff inspection, and validation can support or
challenge that judgment during pre-flight, but they do not silently own
the decision by themselves.

## Default

- Not every cycle is a release.
- Every cycle still updates the living docs honestly.
- Every release still needs a user-facing explanation, not just a
  ledger entry.
- `README.md` should point at durable release surfaces, not accumulate
  per-version sediment.

## Sequence

1. Shape the release in `docs/method/releases/vX.Y.Z/release.md`.
2. Accept the release scope and version justification before tagging.
3. Draft the user-facing release notes in `docs/releases/vX.Y.Z.md`.
4. Run the sequential pre-flight in `docs/method/release-runbook.md`.
5. Tag, publish, and verify delivery directly.
6. Ship sync repo-level surfaces that the release changed.

Future automation may add a release-readiness witness or rollup, but it
should summarize the release-scoped cycle evidence above rather than
replace it.

## User-Facing Release Notes

`docs/releases/vX.Y.Z.md` should be documentation, not ledger sludge.
At minimum it should answer:

- Summary
- What Changed
- Why It Matters
- Breaking Changes
- Migration
- Links to deeper docs

If no migration is required, say `No migration required.` explicitly.

## Runbook

The doctrine lives here. The command-by-command, abort-fast release
procedure lives in `docs/method/release-runbook.md` so it can become
more explicit or automated later without bloating the core doctrine.
