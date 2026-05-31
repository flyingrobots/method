---
title: "Graveyard Lifecycle Semantics Audit"
---

# Graveyard Lifecycle Semantics Audit (Audit 004)

Date: 2026-04-26

Triggered by: an agent working in `~/git/graft` repeatedly moved
completed release backlog cards into `docs/method/backlog/graveyard/`
instead of treating the retro packet as the completion artifact. This
audit checks whether METHOD's own docs and implementation contain
contradictory or ambiguous guidance that could explain that behavior.

---

## 1. Executive Summary

METHOD's primary lifecycle docs mostly say the right thing:

- completed work is represented by a closed cycle packet with a retro
  and witness
- retired work is represented by a graveyard tombstone with an explicit
  disposition

However, the repo contains three conflicting signals:

1. `docs/method/graveyard/README.md` says a backlog item can enter the
   graveyard when it was "completed indirectly by a broader cycle."
   That wording blurs completion and retirement.
2. `graveyard` is not reserved as a non-live lane in the domain model,
   so APIs can treat `graveyard` as a normal backlog lane.
3. `method backlog move --to graveyard`, the MCP equivalent, and the
   GitHub adapter can move backlog items to the graveyard without the
   explicit disposition contract enforced by `method retire`.

Net: the doctrine is directionally clear, but the docs and tool seams
leave enough ambiguity for an agent to use the graveyard as a
completed-work sink.

---

## 2. Expected Lifecycle

The strongest lifecycle source is `docs/PROCESS.md`.

Evidence:

- `docs/PROCESS.md` lines 51-52: pull moves work into
  `docs/design/<cycle>.md` or release-scoped design docs.
- `docs/PROCESS.md` lines 67-70: close writes a retro in
  `docs/method/retro/<cycle>/<cycle>.md` or
  `docs/releases/<version>/retros/<cycle>/<cycle>.md`.
- `docs/PROCESS.md` lines 44-45: a full cycle is complete "after the
  retro."

`docs/GUIDE.md` is even more explicit in its file lifecycle diagram:

- `BI -->|pull| DD`
- `DD -->|close| RD`
- `DD -->|close| W`
- `BI -->|retire| GY`

That says completion and retirement are separate paths:

- completed cycle: design plus retro plus witness
- retired proposal: graveyard

The command docs agree:

- `docs/CLI.md`: `method pull` promotes backlog work into a cycle
  packet.
- `docs/CLI.md`: `method close` closes an active cycle into a retro
  packet.
- `docs/CLI.md`: `method retire` retires a live backlog note into the
  graveyard with an explicit disposition record.
- `docs/MCP.md`: `method_retire` records a required retirement reason
  under a graveyard disposition section.

This is the model agents should follow.

---

## 3. Contradiction: Graveyard Entry Criteria Blur Completion

`docs/method/graveyard/README.md` says:

> A backlog item was completed indirectly by a broader cycle.

This entry criterion is ambiguous. It can be read as:

- acceptable: a standalone proposal was superseded or absorbed and
  should no longer be active as its own task
- dangerous: a completed backlog card should be moved into graveyard
  as part of closeout

The second reading contradicts the PROCESS and GUIDE lifecycle, where
completion is recorded by a retro and witness.

Recommended rewrite:

> A backlog item was superseded or absorbed as standalone work by a
> broader cycle, and the completion record lives in that cycle's retro.

Also add a hard negative:

> Completed work is not graveyarded. Completion is signaled by a closed
> cycle packet and retro. Graveyard is only for retired, canceled,
> superseded, or no-longer-live proposals.

Severity: HIGH for agent behavior, because this is a doctrinal
ambiguity that can directly produce wrong repo bookkeeping.

---

## 4. Implementation Bug: `graveyard` Is Accepted As A Live Lane

Default config defines graveyard outside the backlog tree:

- `src/config.ts`: `graveyard` defaults to `docs/method/graveyard`.

Canonical backlog lanes are:

- `src/domain.ts`: `LANES = ['inbox', 'asap', 'bad-code', 'cool-ideas']`

But lane normalization accepts any slug matching the lane pattern, and
`normalizeLiveBacklogLane()` only rejects `root`.

Consequences:

- `method backlog add --lane graveyard ...` can treat `graveyard` as a
  live backlog lane and create `docs/method/backlog/graveyard/...`.
- A repo can accidentally materialize `docs/method/backlog/graveyard/`,
  which looks like a first-class backlog lane but conflicts with
  METHOD's configured graveyard path.
- Status/query logic can treat that directory as active backlog unless
  repo-specific tooling filters it out.

Recommended fix:

1. Reserve `graveyard` in lane validation.
2. Make `normalizeLiveBacklogLane()` reject `graveyard`.
3. Make `method backlog add --lane graveyard` fail with guidance to use
   `method retire`.
4. Add tests proving `graveyard` cannot be used as a live backlog lane.

Severity: HIGH for data-model correctness.

---

## 5. Implementation Bug: Move Bypasses Retirement Semantics

`Workspace.moveBacklogItem()` special-cases target lane `graveyard` and
moves files to `this.paths.graveyard`.

`Workspace.retireBacklogItem()` then calls `moveBacklogItem(...,
'graveyard')` and adds the required disposition body.

The problem is that `moveBacklogItem(..., 'graveyard')` is also
reachable without `retireBacklogItem()`:

- `method backlog move <item> --to graveyard`
- `method_backlog_move` with `to: "graveyard"`
- GitHub adapter closed-issue sync

Those paths can move an item to the graveyard without:

- an explicit reason
- `--yes`
- a `## Disposition` section
- a `## Original Proposal` section
- a replacement/successor reference

That contradicts `method retire` docs and tests, which say graveyard
movement is a reason-bearing tombstone operation.

Recommended fix:

1. Make `method backlog move --to graveyard` fail with "Use
   `method retire` so the tombstone records a disposition."
2. Make `method_backlog_move` apply the same rule.
3. Keep an internal helper for the physical move, but do not expose it
   as generic lane movement.
4. Update the GitHub adapter to call a disposition-aware retirement
   path or require a clear closed-issue disposition.

Severity: HIGH for auditability.

---

## 6. Naming/Path Confusion

METHOD's default graveyard is:

```text
docs/method/graveyard/
```

The incorrect Graft state created:

```text
docs/method/backlog/graveyard/
```

That second path is not the METHOD default graveyard. It is a live
backlog lane named `graveyard`, which should probably be invalid.

This path distinction should be documented and enforced:

- `docs/method/graveyard/`: retired artifacts and tombstones
- `docs/method/backlog/<lane>/`: active backlog lanes only
- `docs/method/backlog/graveyard/`: invalid unless a repo has
  explicitly configured that as its graveyard path, which would be a
  surprising and discouraged configuration

Severity: MEDIUM/HIGH, because this is likely what made the Graft
bookkeeping error look locally plausible.

---

## 7. Recommended Acceptance Criteria For A Fix Cycle

1. `docs/PROCESS.md` explicitly states that completed work is never
   graveyarded; completion is signaled by retro/witness.
2. `docs/method/graveyard/README.md` distinguishes absorbed/superseded
   proposals from completed cycles.
3. `graveyard` is reserved and rejected as a live backlog lane.
4. `method backlog add --lane graveyard` fails.
5. `method backlog move <item> --to graveyard` fails and points to
   `method retire`.
6. `method_backlog_move` follows the same rule.
7. `method_retire` remains the only public graveyard move path.
8. GitHub closed-issue sync records a disposition or does not move live
   backlog items to graveyard automatically.
9. Tests cover CLI, MCP, API, and docs behavior.

---

## 8. Suggested Backlog Card

```markdown
---
title: "Reserve graveyard and enforce disposition-bearing retirement"
legend: PROCESS
lane: bad-code
priority: high
acceptance_criteria:
  - "Completed work is documented as retro/witness, not graveyard"
  - "`graveyard` is rejected as a live backlog lane"
  - "`method backlog move --to graveyard` fails with guidance to use `method retire`"
  - "`method_retire` is the only public path that moves live backlog items into graveyard"
  - "Graveyard docs distinguish superseded/retired proposals from completed cycles"
---

# Reserve graveyard and enforce disposition-bearing retirement

METHOD currently lets `graveyard` act like a live backlog lane in some
surfaces, while docs also say graveyard entries can include work
"completed indirectly by a broader cycle." This blurs completion and
retirement and can train agents to move completed cards into graveyard.

Fix the docs and tool validation so completed work is represented by a
closed cycle packet, while graveyard movement is reserved for explicit
retirement with a disposition tombstone.
```

---

## 9. Final Assessment

This is not just an agent hallucination problem. The agent made a bad
process call, but METHOD currently provides enough contradictory
evidence to make that bad call understandable:

- PROCESS/GUIDE: completion is retro/witness
- Graveyard README: indirectly completed backlog items can enter
  graveyard
- Domain model: `graveyard` can be a live lane
- Move API: generic backlog move can target graveyard without a
  retirement disposition

The durable fix should be both doctrinal and mechanical: say the rule
plainly, then make the CLI/MCP/API unable to violate it.
