# METHOD

A backlog, a loop, and honest bookkeeping.

## What is METHOD?

METHOD is a lightweight process framework for software projects where
humans and agents collaborate. It provides:

- A **backlog** organized by lanes (inbox, asap, bad-code, cool-ideas)
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

# See what's in the backlog
method status
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

**The filesystem is the database.** A directory is a priority. A
filename is an identity. Moving a file is a decision. `ls` is the query.

**Tests are the executable spec.** Design names the hill and the
playback questions. Tests prove the answers.

**If a claimed result cannot be reproduced, it is not done.** Witnesses
are rerunnable proof, not victory photos.

**Process should be calm.** No sprints. No velocity. No burndown. A
backlog tiered by judgment, and a loop for doing it well.

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
    backlog/
      inbox/                        raw ideas
      asap/                         pull next
      cool-ideas/                   experiments
      bad-code/                     tech debt
    legends/                        named domains
    retro/<cycle>/                  retrospectives + witnesses
    graveyard/                      retired work
```

## The loop

```text
idea → inbox → lane → design doc → RED → GREEN → playback → retro
  → PR/review → main → ship sync
```

See [`docs/PROCESS.md`](docs/PROCESS.md) for the full cycle doctrine.

## License

[Apache 2.0](LICENSE)
