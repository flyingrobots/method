---
title: "Method CLI"
outcome: hill-met
drift_check: yes
---

Design: `docs/design/0001-method-cli/method-cli.md`



## Summary

The CLI cycle shipped a repo-native TypeScript/Bijou command surface for
`init`, `inbox`, `pull`, `close`, and `status`. Playback confirmed that a
contributor can move a METHOD repo forward without hand-editing directory
paths, and the same command contract is stable enough for agent use.

Witness capture also surfaced one small but real drift item:
`method help <command>` was falling back to generic help. That was fixed in
this cycle and covered by regression tests before closeout.

## Playback Witness

- [Playback Transcript](./witness/playback.md)
- [Verification Output](./witness/verification.md)

## Drift

- `method help <command>` returned generic help during playback capture.
  Fixed before closeout and covered by `tests/cli.test.ts`, so no shipped
  drift remains.

## New Debt

- None recorded.

## Cool Ideas

- None recorded.

## Backlog Maintenance

- [x] Inbox processed
- [x] Priorities reviewed
- [x] Dead work buried or merged
- Moved `playback-witness-convention` to `docs/method/backlog/asap/`.
- Moved `drift-detector` to `docs/method/backlog/up-next/`.
