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
3. Run `method doctor` and resolve all issues. Zero issues is a release
   gate — this repo must be an example of the correct application of
   what it preaches.
4. Re-execute all cycle witnesses at the release commit and verify they
   are green. Stale witnesses from prior commits do not satisfy this
   gate.
5. Human-in-the-loop: a human operator reviews and attests that each
   human playback question across all release-scoped cycles holds true.
   An agent cannot unilaterally confirm human hills.
6. Draft the user-facing release notes in `docs/releases/vX.Y.Z.md`.
7. Run the sequential pre-flight (see Runbook below).
8. Tag, publish, and verify delivery directly.
9. Ship sync repo-level surfaces that the release changed.

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

Use the runbook below when a release has been shaped and is ready for
pre-flight. This is the execution layer — abort-fast, command-by-command.

### Abort conditions

- Never guess. Never claim success for anything you did not directly
  verify.
- Never fabricate evidence. Record the exact command, exit code, and
  relevant output on failure.
- Ensure the working tree is clean; abort if dirty.
- Confirm `main` is exactly synced with `origin/main`; abort if not.
- Abort if any cycle packets are still open on merged `main`; close or
  repair them before continuing release work.
- Verify required tools, credentials, signing configuration, CI
  visibility, and registry visibility are available; abort if missing.
- Ensure every required validation and publish verification step
  succeeds; abort if any fail.

### Phase 0: Discovery

Before changing anything, determine and record:

- repository type: JS/TS, Rust, or mixed
- package manager and lockfile authority
- all version-bearing manifests
- all publishable units
- latest reachable semver tag matching `v*`
- current branch
- exact sync state versus `origin/main`
- active cycle count on `main`

If any discovery item cannot be determined confidently, abort.

### Phase 1: Guards

Run these in order:

1. Verify the working tree is clean.
2. Verify the current branch is `main`.
3. Fetch `origin/main` and tags.
4. Verify `HEAD` exactly matches `origin/main`.
5. Verify zero active cycles are open on `main`.
6. Verify tag-signing requirements if the repository requires signed
   tags.

Do not continue past the first failed guard.

### Phase 2: Versioning and release notes

1. Confirm the target version declared in
   `docs/method/releases/vX.Y.Z/release.md`.
2. Validate that the declared version matches the actual release scope,
   SemVer impact, and repository policy.
3. Verify that the target tag does not already exist locally or on the
   remote.
4. Update all in-scope version-bearing manifests in lock-step.
5. Refresh lockfiles using the repo-native package manager.
6. Update `CHANGELOG.md`.
7. Write or refresh `docs/releases/vX.Y.Z.md`.

`README.md` may link to durable release surfaces, but it should not
become a per-version release log by default.

### Phase 3: Witness and human verification

These gates must pass before technical validation.

1. Run `method doctor` and confirm zero issues.
2. Re-execute all cycle witnesses at the current commit:
   - `npm run build && npm test && method drift` for each active or
     release-scoped cycle.
   - Abort if any witness is not green at this commit.
3. Human-in-the-loop confirmation:
   - A human operator reviews every human playback question across all
     release-scoped cycles.
   - For each human hill, the operator attests: "I have verified this
     holds true at the current commit."
   - An agent cannot skip, simulate, or unilaterally confirm this step.
   - Record the attestation in the release verification witness.

### Phase 4: Validation

Run validation strictly in order, using repo-native commands where
available:

- release pre-flight script, if the repo already has one
- build
- lint, if present
- typecheck, if present
- full test suite
- packaging or publish dry-runs for each publishable unit
- dependency audit
- registry-compatibility checks for dependencies and package metadata

Abort on the first hard failure. Do not claim success from queued or
in-progress CI state.

### Phase 5: Commit, tag, and publish

1. Review the final diff.
2. Stage the release changes.
3. Create the release commit.
4. Create the release tag.
5. Verify the tag points at the release commit and satisfies signing
   requirements where applicable.
6. Push `main` and the exact release tag atomically, for example:
   `git push origin main vX.Y.Z`.
7. Create the GitHub Release or equivalent forge release using the
   versioned release notes.
8. Monitor triggered workflows to completion.
9. Verify registries directly before claiming publication succeeded.

### Evidence

Record the release witness in
`docs/method/releases/vX.Y.Z/verification.md`. At minimum include:

- discovery facts
- commands run
- pass/fail results
- tag and commit SHAs
- GitHub Release URL
- registry URLs
- any non-blocking warnings
