# BEARING

This signpost summarizes direction. It does not create commitments or
replace backlog items, design docs, retros, or CLI status.

## Where are we going?

Current priority: pull `PROCESS_cli-module-split` and turn the CLI
entry point back into a thin shell around smaller runtime-owned modules.

## What just shipped?

`0006-ci-gates` - the repo now has a minimal CI gate on GitHub Actions,
running `npm ci`, `npm run build`, and `npm test` on `ubuntu-24.04`
with Node `22`.

## What feels wrong?

- `src/cli.ts` is still carrying too many concerns at once, which makes
  review and future cycle work harder than it should be.
- Generated signposts are still only partially formalized: provenance is
  defined, but generated-file markers and regeneration guidance are not
  part of the shipped contract yet.
- Review state still lives outside METHOD's repo-native coordination
  surface; branch and PR context carry that truth for now.
