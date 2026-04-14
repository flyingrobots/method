# METHOD

A backlog, a loop, and honest bookkeeping.

## Principles

### Stances

**The agent and the human sit at the same table.** They see different
things. Both are named in every design as abstract roles (e.g.,
"Repository Operator", "System Architect"), not literal people or tool
instances. Both must agree before work ships.

When METHOD says `user`, it means the served perspective or beneficiary
of the change, like in a user story. It does not mean a specific named
person who must be present during authorship or playback.

**The METHOD repo gets no special pleading.** The repository that
defines METHOD should use METHOD on itself. If repo truth conflicts with
`README.md`, `docs/GUIDE.md`, `docs/PROCESS.md`, or release
doctrine, repair the repo or evolve the method through an explicit
cycle. Do not treat the tool's own repo as exempt from the bookkeeping
it asks of others.

**Default to building the agent surface first** - it is the foundation
the human experience stands on. If the work is human-first exploratory
design, say so in the design doc.

**Agent surfaces must be explicit and inspectable.** If work is
agent-mediated, say what is agent-generated, why it exists, what
evidence it relies on, and what action it expects next.

**The filesystem is the database.** A directory is a priority. A
filename is an identity. Moving a file is a decision. `ls` is the
query.

**Process should be calm.** No sprints. No velocity. No burndown. A
backlog tiered by judgment, and a loop for doing it well.

### Design constraints

**Meaning must survive without decoration.** If the work only makes
sense with color, layout, motion, or shared visual context, the design
is unfinished. Rich interaction is valuable, but the underlying truth
must stand on its own.

**Accessibility is a product concern, not a fallback string path.**
Designs must name the linear reading model and reduced-complexity
experience, not assume the default operator.

**Localization is not translation after the fact.** Wording, wrapping,
formatting, and directionality are design constraints from the start.
Prefer logical `start`/`end` thinking over hardcoded left/right
assumptions.

### Quality gates

**Everything traces to a playback question.** If you cannot say which
question your work answers, you are drifting. Stop. Reconnect to the
design, or change it.

**Tests are the executable spec.** Design names the hill and the
playback questions. Tests prove the answers. No ceremonial prose
between intent and proof.

**If a claimed result cannot be reproduced, it is not done.**
Witnesses are not victory photos. They are rerunnable proof.

---

## Structure

```text
docs/
  invariants/
    <name>.md                       properties that must remain true
  method/
    backlog/
      inbox/                        raw ideas, anyone, anytime
      asap/                         do this now
      cool-ideas/                   experiments, wild thoughts
      bad-code/                     tech debt
      vX.Y.Z/                       release-scoped planning lane
      <repo-lane>/                  other repo-defined planning lanes
      *.md                          everything else
    legends/                        named domains
    retro/<cycle>/<task>.md         retrospectives
    releases/vX.Y.Z/                internal release packets
    graveyard/                      rejected ideas
  GUIDE.md                          operator advice and non-doctrinal practice notes
  PROCESS.md                        how cycles run (signpost)
  RELEASE.md                        how releases work, including runbook (signpost)
  releases/
    vX.Y.Z.md                       user-facing release notes and migration guides
    README.md                       release note structure
  design/
    <cycle>/<task>.md               cycle design docs
    *.md                            living documents
```

Repo signposts live at root or one level into `docs/`. `README.md` is
the standing root exception; every other signpost uses `ALL_CAPS.md`.
Deeper than that, it is not a signpost.

Release notes live under `docs/releases/`, and internal release packets
live under `docs/method/releases/`.

---

## Signposts

METHOD expects a few bounded repo-level signposts. They summarize the
state of the repo; they do not create commitments.

| Signpost | Role |
|----------|------|
| `README.md` | The operating doctrine and filesystem shape. |
| `ARCHITECTURE.md` | How the source code is organized. |
| `docs/BEARING.md` | Current direction, last shipped cycle, and tensions at cycle boundaries. |
| `docs/VISION.md` | A bounded executive synthesis grounded in repo-visible sources. |
| `docs/CLI.md` | CLI command reference. |
| `docs/MCP.md` | MCP tool reference. |
| `docs/GUIDE.md` | Operator advice and non-doctrinal practice notes. |

Generated signposts should carry generation metadata and a source
manifest. Unless they say otherwise explicitly, they are making
artifact-history claims, not semantic-provenance claims.

---

## Backlog

Markdown files. Each describes work worth doing. The filesystem is
the index.

### Inbox

Anyone - human or agent - drops ideas in at any time. A sentence is
enough. No legend, no scope, no ceremony. Capture it. Keep moving.
The inbox is processed during maintenance.

### Lanes

| Lane | Purpose |
|------|---------|
| `inbox/` | Unprocessed. |
| `asap/` | Pull into a cycle soon. |
| `cool-ideas/` | Not commitments. |
| `bad-code/` | It works, but it bothers you. |

Repos may also create custom first-level backlog lanes when the default
buckets stop being the right planning surface. A lane such as
`v1.1.0/` is valid when the repo wants to group candidate work toward a
named release target or another explicit planning bucket.

`method init` scaffolds the canonical lanes above. Custom lanes are
created intentionally on demand. Backlog root remains a valid escape
hatch, but items there should be short-lived because `method doctor`
warns on unclassified root backlog files.

### Naming

Legend prefix if applicable. No numeric IDs.

```text
PROCESS_behavior-spike-convention.md
SYNTH_generated-signpost-provenance.md
debt-trailer-codec-dts.md
```

### Promoting

When a backlog item is pulled into a cycle, it becomes a design doc.
Unreleased work without explicit release scope goes to `docs/design/`.
Release-tagged work goes to `docs/releases/<version>/design/`.

```text
backlog/asap/SYNTH_executive-summary-protocol.md -> design/<cycle>/executive-summary-protocol.md
backlog/v2.4.5/PROCESS_release-scope.md -> releases/v2.4.5/design/<cycle>/release-scope.md
```

The backlog file is removed. Work does not live in two places.

### Commitment

Pull it and you own it - "you" meaning the named sponsor roles (human and
agent) in the design doc. It does not go back.

- **Finish** - hill met.
- **Pivot** - end early, write the retro. Remaining work re-enters
  the backlog as a new item with fresh scope.

### Maintenance

End of cycle:

- Process inbox. Promote, flesh out, or bury.
- Re-prioritize. What you learned changes what matters.
- Clean up. Merge duplicates, kill the dead.

Do not reorganize mid-cycle.

### Cycle types

Same loop regardless:

- **Feature** - design, test, build, ship.
- **Design** - the deliverable is docs, not code.
- **Debt** - pull from `bad-code/`. The hill is "this no longer
  bothers us."

---

## Invariants

A named property that must remain true across all cycles. Invariants
live in `docs/invariants/<name>.md`. Each one states the property, why
it matters, and how to check whether it still holds.

Invariants are local to the repo. Each project discovers its own.
A repo with no invariants yet is normal - they surface as you learn
what actually breaks when it drifts.

An invariant file should answer:

1. **What must remain true?** - one sentence.
2. **Why does it matter?** - what breaks if it drifts.
3. **How do you check?** - the concrete test, query, or inspection.

Invariants give legends their job. A legend without an invariant is
just an area of attention. A legend guarding an invariant has a
standing question: did this cycle preserve it?

---

## Legends

A named domain that spans many cycles. Legends organize attention, not
timelines - they are reference frames, not milestones. A legend never
starts or finishes. It describes what it covers, what invariants it
guards, what success looks like, and how you know.

A legend's standing playback questions should ask whether its
invariants held. This is what makes a legend load-bearing: not the
backlog items it covers, but the properties it protects.

A legend code (for example, `PROCESS` or `SYNTH`) prefixes backlog filenames so
that `ls` reveals domain load at a glance. Legends live in
`docs/method/legends/` as standalone documents.

The current legends in this repo are:

- `PROCESS` - METHOD's own mechanics: cycle discipline, backlog
  operations, drift detection, and named work patterns. Guards
  **cycle-traceability** and **commitment-integrity**.
- `SYNTH` - repo-wide synthesis and signposts: executive summaries,
  generated signpost provenance, and the boundary between artifact
  history and semantic provenance. Guards **signpost-provenance** and
  **signpost-boundedness**.

Not every METHOD repo needs these exact legends. Legends are local to
the repo and should reflect the domains that actually organize its
work.

---

## Cycles

A cycle is a unit of shipped work. Design, implementation,
retrospective. Numbered sequentially.

### Size

A cycle has no prescribed duration. It should be small enough that a
failed one teaches more than it costs. If you cannot describe the hill
in one sentence, the cycle is too big. Split it.

### The loop

0. **Pull** - choose from the backlog. Create a branch
   (`cycles/####-slug`), move the item into `docs/design/<cycle>/`.
   You are now committed.

1. **Design** - write a design doc. Required sections:

   - Sponsor human
   - Sponsor agent
   - Hill (one sentence)
   - Playback questions - yes/no, both perspectives. Write them first.
   - Accessibility / assistive reading posture
   - Localization / directionality posture
   - Agent inspectability / explainability posture
   - Non-goals

   If a posture is not relevant, say so explicitly. Silence is not a
   position.

2. **RED** - write failing tests. Playback questions become specs.
   Default to agent surface first. Where relevant to the hill, also
   cover the golden path, failure modes, and edge cases. If a category
   does not apply, say so in the design doc or test file.

3. **GREEN** - make them pass.

4. **Playback** - produce a witness. The agent answers agent
   questions. The human answers user questions. Write it down.

   Those are perspective labels, not literal identities. `agent` names
   the machine-operable seat in the workflow, and `user` names the
   served perspective the hill claims to satisfy.

   The **witness** is the concrete artifact - test output, transcript,
   screenshot, recording - that shows both answers. No clear yes means
   no. If the witness cannot be reproduced from committed commands,
   inputs, or mechanisms, the answer is still no. Observational
   artifacts may support the witness, but they do not carry the
   done-claim by themselves. If the hill claims accessibility,
   localization, or agent-facing explainability, witness those paths
   too.

5. **Close** - write the retro and witness packet on the branch.

   - Drift check (mandatory). Undocumented drift is the only true
     failure mode.
   - New debt to `bad-code/`.
   - Cool ideas to `cool-ideas/`.
   - Backlog maintenance.

   Closing the cycle packet does not mean `main` has accepted it yet.
   Review-stage visibility now has a repo-native METHOD query:
   `method review-state`. It summarizes branch and PR state when forge
   context is available; the underlying review work still lives on the
   branch and PR.
   If `main` is ever found carrying an open cycle packet or a
   release-prep exception, stop and repair that state before claiming
   repo truth, release readiness, or ship-sync cleanliness.

6. **PR / review** - review the full cycle packet until merge or
   rejection.

7. **Ship sync on `main`** - after merge, update repo-level ship
   surfaces such as `docs/BEARING.md`, `CHANGELOG.md`, and release
   notes when the cycle changes them.

   Releases happen when externally meaningful behavior changes. Not
   every cycle is a release. Ship sync only happens on merged `main`
   state, not branch-local closeout state.
   `main` is not a parking lot for open cycle packets.

### Disagreement at playback

Both sponsors must say yes. When they disagree:

1. Name the disagreement in the witness. What does the agent see that
   the human does not, or vice versa?
2. If the gap is scoping - the hill was met but the answer is
   unsatisfying - the cycle is **partial**. Merge what is honest.
   Write the retro. File a new backlog item for the remainder.
3. If the gap is correctness - one sponsor believes the work is
   wrong - do not merge it. Return to RED or GREEN. If the work is
   abandoned instead of fixed, close the cycle as **not met** and write
   the retro.

The human does not automatically override the agent. The agent does
not automatically override the human. The design doc is the tiebreaker:
does the witness answer the playback questions or not?

### Outcomes

- **Hill met** - close the packet, review it, merge it, then ship sync.
- **Partial** - close the packet honestly, merge only what is honest,
  and let the retro explain the gap.
- **Not met** - cycle still concludes. Write the retro. A failed
  cycle with a good retro beats a successful one with no learnings. A
  failed cycle does not need to merge to end honestly.

Every cycle ends with a retro. Success is not required.

---

## Coordination

METHOD is designed for a solo developer working with an agent. It
scales to a team without adding meetings, roles, or synchronization
ceremonies. The mechanism is passive legibility.

### The filesystem is the coordination layer

If you can answer these questions by reading the repo, you do not need
a standup:

- What is actively open in this workspace? -> `method status`
- Is this workspace structurally healthy? -> `method doctor`
- What is under review? -> `method review-state`
- What is committed? -> each design doc names its sponsors and hill
- What is next? -> `method status` and the current lane under `docs/method/backlog/`
- What failed and why? -> `ls docs/method/retro/`
- What did we decide not to do? -> `ls docs/method/graveyard/`

If any of these are unclear, the docs are incomplete. Fix the docs,
not the process.

Review state now has a repo-native query surface through
`method review-state`. It still reads branch and PR context rather than
the filesystem alone, but that coordination question no longer requires
ad hoc `gh` reconstruction.

### BEARING.md

A single living document at `docs/BEARING.md`. One page, updated at
cycle boundaries - not mid-cycle. It answers three questions:

1. **Where are we going?** - the current priority (legend, theme, or
   plain English).
2. **What just shipped?** - last completed cycle, one line.
3. **What feels wrong?** - known tensions, open questions, gut
   feelings that do not yet have backlog items.

`BEARING.md` is a signpost, not a status report. It summarizes
direction; it does not create commitments, replace backlog items, or
record decisions that belong in design docs, retros, or the backlog.
It is updated during ship sync after merge. On a solo project, that is
usually you. On a team, it is whoever merges last or owns the ship
sync. No scheduling, no rotation, no process.

If the bearing drifts without anyone noticing, that is the signal to
talk - not a meeting, just a conversation. The drift itself is the
agenda.

### Conflict at the backlog

Two people pulling conflicting work from `asap/` is a design-doc
problem, not a process problem. Active design docs are visible through
`method status` and the repo itself. If your hill contradicts an
active cycle's hill, you should see it at step 1. Resolve it there or
file it as a tension in `docs/BEARING.md`.

### What this does not add

No standups. No syncs. No status emails. No sprint planning. No retro
meetings. The retro is a document, not a ceremony. The repo is the
single source of truth. Read it.

---

## Graveyard

Rejected work moves to `docs/method/graveyard/` with a note explaining
why. The graveyard prevents re-proposing without context. If you want
to resurrect something, you must address the note.

Use `method retire` when a live backlog item should become a graveyard
tombstone instead of silently disappearing.

## Intake

Anything not yet shaped into planned work belongs in `inbox/`,
including critique, review notes, and outside-in observations.

Use `method inbox` to capture raw intake without prematurely deciding
whether it belongs in `asap/`, a release lane such as `v2.4.5/`,
`bad-code/`, `cool-ideas/`, or the graveyard. When provenance matters,
record it explicitly with `--source` and `--captured-at`.

---

## Flow

```text
idea -> inbox/ -> chosen lane (cool-ideas/, asap/, v2.4.5/, bad-code/, ...)
  -> design/<cycle>/ or releases/<version>/design/<cycle>/  (committed)
  -> RED -> GREEN -> playback (witness)
  -> retro/<cycle>/ or releases/<version>/retros/<cycle>/   (cycle packet closed)
  -> PR/review -> main
  -> ship sync (BEARING / CHANGELOG / release when meaningful)
      - or ->
  -> graveyard/
```

---

## Tooling

The repo ships a small TypeScript CLI for METHOD workspace operations,
using published Bijou packages for terminal output and prompts.

Install dependencies:

```bash
npm install
```

Run during development:

```bash
npm run method -- status
```

Core commands: `method init`, `method doctor`, `method migrate`, `method inbox`,
`method backlog add`, `method backlog move`, `method backlog edit`, `method backlog list`, `method backlog deps`, `method retire`,
`method signpost status`, `method signpost init`,
`method repair`, `method next`, `method pull`,
`method close`, `method drift`, `method status`, `method mcp`,
`method sync github`, `method sync ship`, `method sync refs`.

See `docs/CLI.md` for the full command reference with flags and
examples. See `docs/MCP.md` for the MCP tool reference
(`method_doctor`, `method_migrate`, `method_status`, `method_inbox`, `method_backlog_add`,
`method_backlog_move`, `method_backlog_edit`, `method_backlog_query`, `method_backlog_dependencies`,
`method_next_work`,
`method_signpost_status`, `method_signpost_init`,
`method_retire`, `method_pull`, `method_drift`,
`method_repair`, `method_close`, `method_sync_ship`, `method_sync_refs`,
`method_sync_github`, `method_capture_witness`).

Repo-local CI currently uses GitHub Actions as a host adapter through
`.github/workflows/ci.yml`. The first cut stays narrow and explicit:

```bash
npm ci
npm run build
npm test
```

The workflow currently runs on `ubuntu-24.04` for Node `22`.
That is repo truth for this host, not METHOD doctrine for every forge.

METHOD may be used alongside other tools, but they are sidecars, not
doctrine. If a repo uses GitHub pull requests and review bots, an
operator may use a tool like Draft Punks Doghouse to inspect live
review state, unresolved threads, and stale approval signals while they
are in the doghouse. That helps wrangle PR feedback; it does not make
GitHub review flow part of METHOD's core contract.

---

## What this system does not have

No milestones. No velocity. No ticket numbers. No required meetings.

METHOD is not a GitHub workflow, a pull-request cockpit, or a
forge-specific review protocol. It can live inside repos that use those
things, but its core contract is backlog discipline, cycle truth, and
reproducible witnesses at the repo level. Review tools may assist the
operator; they do not define the method.

The backlog is tiered by lane. Choice within a lane is judgment at
pull time. Coordination is reading the filesystem. That is enough.

---

## Naming

| Convention | Example | When |
|------------|---------|------|
| `ALL_CAPS.md` | `VISION.md`, `BEARING.md` | Signpost - root or `docs/` |
| `lowercase.md` | `doctrine.md` | Everything else |
| `<LEGEND>_<name>.md` | `SYNTH_executive-summary-protocol.md` | Backlog with legend |
| `<name>.md` | `debt-trailer-codec.md` | Backlog without legend |
| `<cycle>/` | `0010-strand-speculation/` | Cycle directory |
