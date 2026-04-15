---
title: "Verification Witness"
---

Date: 2026-04-02

## Commands

These commands were used to verify the cycle deliverable.

```text
$ npm run method -- status

> method@0.1.0 method
> tsx src/cli.ts status

METHOD Status  ./method

--- Backlog ---
inbox       0  -
asap        0  -
up-next     1  drift-detector
cool-ideas  0  -
bad-code    0  -
root        0  -

--- Active Cycles ---
0002-playback-witness-convention Playback Witness Convention

--- Legend Health ---
untagged backlog=1 active=1

$ rg -n "If a claimed result cannot be reproduced|Produce a reproducible playback witness|not done|reproducible artifact" README.md docs/method/process.md docs/design/0002-playback-witness-convention/*.md
docs/design/0002-playback-witness-convention/witness-artifacts.md:12:If the core claim cannot be reproduced, the cycle is not done.
README.md:21:If a claimed result cannot be reproduced, it is not done. Witnesses are
docs/design/0002-playback-witness-convention/playback-witness-convention.md:22:cannot be reproduced, the cycle is not done.
docs/design/0002-playback-witness-convention/playback-witness-convention.md:139:the reproducible artifact that carries the actual done-claim.
docs/method/process.md:12:- If a claimed result cannot be reproduced, it is not done.
docs/method/process.md:23:5. Produce a reproducible playback witness, including reduced/

$ find docs/design/0002-playback-witness-convention -maxdepth 2 -type f | sort
docs/design/0002-playback-witness-convention/playback-witness-convention.md
docs/design/0002-playback-witness-convention/witness-artifacts.md

$ npm run method -- close --drift-check yes --outcome hill-met

> method@0.1.0 method
> tsx src/cli.ts close --drift-check yes --outcome hill-met

[SUCCESS] Closed 0002-playback-witness-convention
docs/method/retro/0002-playback-witness-convention/playback-witness-convention.md

$ npm run method -- status

> method@0.1.0 method
> tsx src/cli.ts status

METHOD Status  ./method

--- Backlog ---
inbox       0  -
asap        0  -
up-next     1  drift-detector
cool-ideas  0  -
bad-code    0  -
root        0  -

--- Active Cycles ---
-

--- Legend Health ---
untagged backlog=1 active=0
```

## Interpretation

- The doctrine landed in root METHOD docs and in the active cycle docs.
- The cycle contained the two intended design artifacts.
- The cycle closed cleanly through the CLI.
- The backlog boundary remained calm: no inbox items, one `up-next`
  item, no active cycles.
