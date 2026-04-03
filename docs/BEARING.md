# BEARING

This signpost summarizes direction. It does not create commitments or
replace backlog items, design docs, retros, or CLI status.

## Where are we going?

Current priority: pull `PROCESS_cli-module-split` and break
`src/cli.ts` into smaller runtime-owned modules before more commands
accumulate in one file.

## What just shipped?

`0006-ci-gates` - GitHub Actions now runs `npm ci`, `npm run build`,
and `npm test` on `push` and `pull_request`.

## What feels wrong?

- `src/cli.ts` is still too large and mixes command parsing, workspace
  logic, drift logic, and filesystem concerns in one file.
- The new CI gate is intentionally narrow: build and test only, with no
  linting or broader quality policy yet.
- Git branch naming and workflow policy still lives in backlog doctrine,
  not in a settled repo contract.
