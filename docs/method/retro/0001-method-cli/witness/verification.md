# Method CLI Verification Witness

Date: 2026-04-02

## Repository Verification

```text
$ npm test

> method@0.1.0 test
> vitest run --config vitest.config.ts

 RUN  v4.1.2 /Users/james/git/method

 Test Files  1 passed (1)
      Tests  7 passed (7)
   Start at  13:37:36
   Duration  323ms (transform 51ms, setup 0ms, import 106ms, tests 40ms, environment 0ms)

$ npm run build

> method@0.1.0 build
> tsc -p tsconfig.json

$ npm run method -- help close

> method@0.1.0 method
> tsx src/cli.ts help close

Usage: method close [cycle] [--drift-check yes|no] [--outcome hill-met|partial|not-met]

Close an active cycle into docs/method/retro/.

$ npm run method -- status

> method@0.1.0 method
> tsx src/cli.ts status

METHOD Status  /Users/james/git/method

--- Backlog ---
inbox       0  -
asap        1  playback-witness-convention
up-next     1  drift-detector
cool-ideas  0  -
bad-code    0  -
root        0  -

--- Active Cycles ---
-

--- Legend Health ---
untagged backlog=2 active=0
```
