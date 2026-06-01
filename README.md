# METHOD

Issues, a loop, and honest bookkeeping.

## What is METHOD?

METHOD is a lightweight process framework for software projects where
humans and agents collaborate. It provides:

- **GitHub Issues** organized by Method labels (`lane:inbox`,
  `lane:asap`, `lane:bad-code`, `lane:cool-ideas`, release milestones)
- A **cycle loop** (pull → design → test → playback → close → review → ship)
- **Honest bookkeeping** through design docs, retros, witnesses, and drift detection

The agent and the human sit at the same table. Both are named in every
design as abstract roles. Both must agree before work ships.

## Install

```bash
npm install @flyingrobots/method
```

## Quick start

```bash
# Initialize a METHOD workspace
method init .

# Capture an idea
method inbox "Add dark mode support" --legend PROCESS

# Check workspace health
method doctor

# Pick work from GitHub Issues
gh issue list --label lane:asap
```

## Documentation

| Document | What it covers |
|----------|---------------|
| [`docs/PROCESS.md`](docs/PROCESS.md) | Cycle doctrine — how work flows from backlog to shipped |
| [`docs/RELEASE.md`](docs/RELEASE.md) | Release doctrine and runbook |
| [`docs/GUIDE.md`](docs/GUIDE.md) | Operator advice and getting started |
| [`docs/CLI.md`](docs/CLI.md) | CLI command reference |
| [`docs/MCP.md`](docs/MCP.md) | MCP tool reference for agents |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Source code organization |
| [`docs/BEARING.md`](docs/BEARING.md) | Current direction and recent ships |
| [`docs/VISION.md`](docs/VISION.md) | Executive summary of the project |

## Principles

**GitHub Issues are the live work tracker.** A label is a lane. A
milestone is release scope. `work-in-progress` means someone is actively
working the issue. This keeps METHOD legible to ordinary open-source
contributors.

**The repository is the evidence ledger.** Design docs, tests, playback
witnesses, retros, release notes, and generated signposts stay in the
repo because they are durable evidence, not ephemeral tracker state.

**Tests are the executable spec.** Design names the hill and the
playback questions. Tests prove the answers.

**If a claimed result cannot be reproduced, it is not done.** Witnesses
are rerunnable proof, not victory photos.

**Process should be calm.** No sprints. No velocity. No burndown. A
small issue taxonomy, clear evidence, and a loop for doing work well.

**The METHOD repo gets no special pleading.** This repository uses
METHOD on itself. If repo truth conflicts with doctrine, repair the
repo or evolve the method through an explicit cycle.

## Structure

```text
docs/
  PROCESS.md                        cycle doctrine (signpost)
  RELEASE.md                        release doctrine + runbook (signpost)
  GUIDE.md                          operator advice (signpost)
  CLI.md                            command reference (signpost)
  MCP.md                            tool reference (signpost)
  BEARING.md                        current direction (signpost)
  VISION.md                         executive summary (signpost)
  design/
    <LEGEND>_<slug>.md              cycle design docs
  releases/
    vX.Y.Z.md                       user-facing release notes
  method/
    backlog/                        legacy/migration-only backlog cards
    legends/                        named domains
    retro/<cycle>/                  retrospectives + witnesses
    graveyard/                      legacy retired work
.github/
  ISSUE_TEMPLATE/                   GitHub issue forms for Method work
  pull_request_template.md          PR evidence checklist
```

## The loop

```text
GitHub issue → lane label → branch → design doc → RED → GREEN
  → playback → retro
  → PR/review → main → ship sync
```

See [`docs/PROCESS.md`](docs/PROCESS.md) for the full cycle doctrine.

## License

[Apache 2.0](LICENSE)
