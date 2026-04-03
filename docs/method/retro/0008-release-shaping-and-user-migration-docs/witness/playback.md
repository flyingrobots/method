# Playback Witness

Date: 2026-04-03

This was a doctrine-and-scaffolding cycle. The deliverable is a clearer
release method: internal release packets, user-facing release notes, and
a deterministic runbook for release pre-flight.

## Human Playback

### Can I point to one METHOD artifact that defines what a release includes, why the version number is justified, and whether users need migration guidance before anything is tagged?

Yes.

`docs/method/release.md` now defines the required release artifacts and
their responsibilities, while `docs/method/releases/vX.Y.Z/release.md`
is named as the internal packet that must justify included scope,
version choice, and migration requirements before tagging.

### When a release ships, do users get a dedicated release note that is more guided than `CHANGELOG.md` and explicitly says what changed, why it matters, and whether migration is required?

Yes.

`docs/releases/README.md` establishes `docs/releases/vX.Y.Z.md` as the
user-facing release note surface and names the required sections:
Summary, What Changed, Why It Matters, Breaking Changes, Migration, and
deeper links. It also requires an explicit `No migration required.`
verdict when appropriate.

## Agent Playback

### Does the release method keep cycle/backlog topology intact by treating releases as aggregations of shipped work rather than moving backlog items into version-named directories?

Yes.

`docs/method/release.md` now says releases aggregate shipped work and do
not create `docs/method/backlog/<version>/` directories or move backlog
items by version. Priority lanes remain backlog truth; release packets
aggregate already-shipped work.

### Is there a deterministic, sequential release pre-flight that says what must be discovered, validated, tagged, published, and verified, with clear abort conditions and no implied success?

Yes.

`docs/method/release-runbook.md` now defines a sequential runbook with
explicit phases for discovery, guards, versioning and release notes,
validation, and commit/tag/publish. It also carries explicit abort
conditions such as dirty working tree, unsynced `main`, missing
credentials, or unverifiable publish state.

## Outcome

The hill is met. METHOD now has a shaped-release doctrine, a user-facing
release-note home, and a committed pre-flight runbook that can later be
automated without changing the core method.
