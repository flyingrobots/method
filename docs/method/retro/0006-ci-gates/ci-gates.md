# CI Gates Retro

Design: `docs/design/0006-ci-gates/ci-gates.md`
Outcome: hill-met
Drift check: yes

## Summary

This cycle added the repo's first real CI gate. METHOD now ships a
committed GitHub Actions workflow at `.github/workflows/ci.yml` that
runs `npm ci`, `npm run build`, and `npm test` on `push` and
`pull_request`. The README now names that workflow and its command
surface explicitly so the repo's merge-safety story is no longer
dependent on operator memory.

## Playback Witness

- [Witness Index](./witness/README.md)
- [Playback Witness](./witness/playback.md)
- [Verification Witness](./witness/verification.md)

## Drift

- None recorded.

## New Debt

- None recorded.

## Cool Ideas

- None recorded.

## Backlog Maintenance

- [x] Inbox processed
- [x] Priorities reviewed
- [x] Dead work buried or merged
- Moved `PROCESS_git-branch-workflow-policy` from `inbox/` to
  `up-next/`.
- Kept `PROCESS_cli-module-split` and
  `SYNTH_generated-signpost-provenance` in `asap/` as the next
  strongest follow-up pulls.
