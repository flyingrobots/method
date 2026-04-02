# Method CLI Playback Witness

Date: 2026-04-02

Scratch workspace playback was run in a temporary local directory. The
absolute path is redacted as `<tmp>` for readability.

These captures use plain linear terminal output. The command surface stays
understandable without color, borders, or spatial inference.

## Human Playback

### Can I move a METHOD repo forward without remembering every directory and naming rule?

Yes.

```text
$ node /Users/james/git/method/dist/cli.js help close
Usage: method close [cycle] [--drift-check yes|no] [--outcome hill-met|partial|not-met]

Close an active cycle into docs/method/retro/.

$ node /Users/james/git/method/dist/cli.js init
[SUCCESS] Initialized METHOD workspace at <tmp>
- docs/method/backlog/inbox
- docs/method/backlog/asap
- docs/method/backlog/up-next
- docs/method/backlog/cool-ideas
- docs/method/backlog/bad-code
- docs/method/legends
- docs/method/graveyard
- docs/method/retro
- docs/design
- CHANGELOG.md
- docs/method/process.md
- docs/method/release.md

$ node /Users/james/git/method/dist/cli.js inbox "What if Method had a witness convention?" --title "Witness Convention"
[SUCCESS] Captured docs/method/backlog/inbox/witness-convention.md

$ node /Users/james/git/method/dist/cli.js pull witness-convention
[SUCCESS] Pulled into 0001-witness-convention
docs/design/0001-witness-convention/witness-convention.md

$ node /Users/james/git/method/dist/cli.js close --drift-check yes --outcome hill-met
[SUCCESS] Closed 0001-witness-convention
docs/method/retro/0001-witness-convention/witness-convention.md
```

The workflow was completed through CLI commands alone. No directory edits or
path memorization were required beyond the stable command names.

### Can I see what is in the backlog and which cycle is still open from one command?

Yes.

```text
$ node /Users/james/git/method/dist/cli.js status
METHOD Status  <tmp>

--- Backlog ---
inbox       1  witness-convention
asap        0  -
up-next     0  -
cool-ideas  0  -
bad-code    0  -
root        0  -

--- Active Cycles ---
-

--- Legend Health ---
untagged backlog=1 active=0

$ node /Users/james/git/method/dist/cli.js status
METHOD Status  <tmp>

--- Backlog ---
inbox       0  -
asap        0  -
up-next     0  -
cool-ideas  0  -
bad-code    0  -
root        0  -

--- Active Cycles ---
0001-witness-convention Witness Convention

--- Legend Health ---
untagged backlog=0 active=1
```

## Agent Playback

### Can I manipulate the backlog and cycle structure through a stable CLI instead of reimplementing filesystem rules every turn?

Yes.

The agent used the same stable verbs the human uses: `init`, `inbox`, `pull`,
`status`, and `close`. Each command returned either explicit success/failure
text or the concrete path to the generated design or retro file.

### Does the CLI preserve METHOD's commitments instead of inventing a second source of truth outside the repository?

Yes.

```text
$ find docs -maxdepth 4 -type f | sort
docs/design/0001-witness-convention/witness-convention.md
docs/method/process.md
docs/method/release.md
docs/method/retro/0001-witness-convention/witness-convention.md
```

The state changes are filesystem-visible: the backlog note becomes a design
doc, closeout creates a retro, and the repo carries the workflow truth.

## Note

During witness capture, `method help <command>` initially fell back to generic
help. That drift was fixed in this cycle and covered by regression tests before
closeout.
