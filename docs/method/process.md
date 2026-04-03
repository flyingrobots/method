# Process

METHOD cycles run as a calm pull-design-test-playback-close-review-ship-sync loop.

## Rules

- Pulling work is commitment. The backlog item does not go back.
- Playback questions drive the design and the tests.
- Designs must name their accessibility/assistive posture,
  localization/directionality posture, and agent inspectability posture
  explicitly, even if the answer is "not in scope."
- If a claimed result cannot be reproduced, it is not done.
- Drift is checked explicitly at close, not hand-waved after the fact.
- Backlog maintenance happens at cycle boundaries, not continuously.
- Repo-level ship surfaces such as `BEARING.md` and `CHANGELOG.md`
  reflect merged `main` state, not branch-local closeout state.
- Review visibility currently rides on branch state and the closed
  cycle packet; `method status` tracks open workspace cycles only.

## Default Loop

1. Pull an item from the backlog into `docs/design/<cycle>/`.
2. Write the design with both human and agent sponsors named, plus the
   accessibility, localization, and agent-inspectability contract.
3. Write failing tests from the playback questions.
4. Make the tests pass.
5. Produce a reproducible playback witness, including reduced/
   linearized, localized, or agent-facing paths when the hill claims
   them. A purely observational artifact may support the witness, but
   it does not satisfy done on its own.
6. Close the cycle packet with a retro in `docs/method/retro/<cycle>/`.
7. Review the complete cycle packet on a branch or PR.
8. After merge, update repo-level ship surfaces on `main` such as
   `BEARING.md`, `CHANGELOG.md`, and release notes when relevant.
