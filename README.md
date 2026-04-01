# METHOD

A backlog, a loop, and honest bookkeeping.  

## Principles

### The agent and the human sit at the same table.  

They see different things.   
Both are named in every design.  
Both must agree before work ships.   
Build the agent surface first: it is the foundation the human experience stands on.  

### Everything traces to a playback question. 
  
If you cannot say which question your work answers, you are drifting.   
Stop.   
Reconnect to the design, or change it.  

### Tests are the spec. 

Code exists because a test demanded it.    
Tests exist because a design said what should be true.    
No prose layer between intent and proof.  

### The filesystem is the database. 

A directory is a priority.   
A filename is an identity.   
Moving a file is a decision.   
`ls` is the query.  

### Process should be calm. 

No sprints.   
No velocity.   
No burndown.   
A backlog ordered by judgment, and a loop for doing it well.  

## Structure

```
docs/
  method/
    backlog/
      inbox/                        raw ideas, anyone, anytime
      asap/                         do this now
      up-next/                      do this soon
      cool-ideas/                   experiments, wild thoughts
      bad-code/                     tech debt
      *.md                          everything else
    legends/                        named domains
    retro/<cycle>/<task>.md         retrospectives
    graveyard/                      rejected ideas
    process.md                      how cycles run
    release.md                      how releases work
  design/
    <cycle>/<task>.md               cycle design docs
    *.md                            living documents
```

### Signpost documents live at root or one level into `docs/`. 

They use `ALL_CAPS.md`.   
Deeper than that, it is not a signpost.  

## Backlog

Markdown files.   
Each describes work worth doing.   
The filesystem is the index.  

### Inbox

Anyone — human or agent — drops ideas in at any time.   
A sentence is enough.   
No legend, no scope, no ceremony.   
Capture it.   
Keep moving.  
The inbox is processed during maintenance.

### Lanes

- **`inbox/`** — unprocessed.  
- **`asap/`** — pull into a cycle soon.  
- **`up-next/`** — next in line.  
- **`cool-ideas/`** — not commitments.  
- **`bad-code/`** — it works, but it bothers you.  

Anything else sits in the backlog root.

### Naming

Legend prefix if applicable.   
No numeric IDs.  

```
VIZ_braille-rendering.md
PROTO_strand-lifecycle.md
debt-trailer-codec-dts.md
```

### Promoting

Pulled into a cycle, a backlog item becomes a design doc:

```
backlog/asap/PROTO_strand-lifecycle.md → design/<cycle>/strand-lifecycle.md
```

The backlog file is removed.  

### Commitment

Pull it and you own it.   
It does not go back.  

- **Finish** — hill met.  
- **Pivot** — end early, write the retro. Remaining work re-enters the backlog as a new item.  

### Maintenance

End of cycle:  

- Process inbox. Promote, flesh out, or bury.  
- Re-prioritize. What you learned changes what matters.  
- Clean up. Merge duplicates, kill the dead.  

Do not reorganize mid-cycle.

### Cycle types

Same loop regardless:

- **Feature** — design, test, build, ship.
- **Design** — the deliverable is docs, not code.
- **Debt** — pull from `bad-code/`. The hill is "this no longer bothers us."

## Legends

A named domain that spans many cycles.   
Each legend describes what it covers, who cares, what success looks like, and how you know.  
Legends do not start or finish.   
They are reference frames.  
A legend code (`VIZ`, `PROTO`, `TUI`) prefixes backlog filenames.  

## Cycles

A unit of shipped work.   
Design, implementation, retrospective.  
Numbered sequentially.  

### The loop

0. **Pull** — choose. Move it. Committed.  

1. **Design** — write a design doc in `docs/design/<cycle>/`.  
   - Sponsor human
   - Sponsor agent
   - Hill
   - Playback questions — yes/no, both perspectives. Write them first.
   - Non-goals

2. **RED** — write failing tests. Playback questions become specs.
   Agent surface first.

3. **GREEN** — make them pass.

4. **Playback** — agent answers agent questions. Human answers user
   questions. Write it down. No clear yes means no.

5. **PR → main** — review until merge.

6. **Close** — merge. Retro in `docs/method/retro/<cycle>/`.
   - Drift check (mandatory). Undocumented drift is the only failure.
   - New debt to `bad-code/`.
   - Cool ideas to `cool-ideas/`.
   - Backlog maintenance.
   - CHANGELOG. Version. Tag. README.

### Outcomes

- **Hill met** — merge, close.
- **Partial** — merge what is honest. Retro explains the gap.
- **Not met** — cycle still concludes. Write the retro. 

A failed cycle with a good retro beats a successful one with no learnings.
Every cycle ends with a retro.   
Success is not required.  

## Graveyard

Rejected work moves to `docs/method/graveyard/` with a note.   
The graveyard prevents re-proposing without context.  

## Flow

```
idea → inbox/ → cool-ideas/ → up-next/ → asap/
  → design/<cycle>/  (committed)
  → RED → GREEN → playback
  → retro/<cycle>/
  → CHANGELOG, release
      — or →
  → graveyard/
```

## What this system does not have

No milestones.   
No roadmap.   
No index files.   
No velocity.   
No ticket numbers.   
Names are descriptive.   
Judgment is the prioritization engine.   
The backlog is ordered.   
That is enough.  

## Naming

| Convention | Example | When |
|------------|---------|------|
| `ALL_CAPS.md` | `VISION.md` | Signpost — root or `docs/` |
| `lowercase.md` | `doctrine.md` | Everything else |
| `<LEGEND>_<name>.md` | `VIZ_braille.md` | Backlog with legend |
| `<name>.md` | `debt-trailer-codec.md` | Backlog without |
| `<cycle>/` | `0010-strand-speculation/` | Cycle directory |
