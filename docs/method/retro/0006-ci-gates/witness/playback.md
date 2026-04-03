# Playback Witness

Date: 2026-04-03

This was an infrastructure cycle. The deliverable is a minimal CI gate
for this repo, with explicit commands and explicit documentation.

## Human Playback

### Can I inspect the repo and see which automated checks guard pushes and PRs, without reading chat history or relying on remembered local commands?

Yes.

The repo now contains both the workflow and the prose contract:

- `.github/workflows/ci.yml` names the CI job, triggers, runtime, and
  steps.
- `README.md` names GitHub Actions as the current host adapter and
  lists the exact commands it runs.

That makes the guard surface visible from committed files alone.

### If CI fails, does the workflow name the failing step clearly enough that I can reproduce it locally with the same commands?

Yes.

The workflow uses explicit step names:

- `Install dependencies`
- `Build`
- `Run tests`

Each step maps directly to a local command shown in the README and
verification witness:

- `npm ci`
- `npm run build`
- `npm test`

## Agent Playback

### Are the workflow triggers, Node version, dependency-install strategy, and executed commands explicit in committed files rather than hidden in GitHub settings or tool defaults?

Yes.

`.github/workflows/ci.yml` commits all of the first-cut contract:

- triggers: `push`, `pull_request`
- runtime: `ubuntu-latest`
- Node version: `22`
- install mode: `npm ci`
- executed commands: `npm run build`, `npm test`

No hidden branch-protection rule or chat-only instruction is required
to reconstruct the CI behavior.

### Does the first cut stay narrow and deterministic by running only the repo's current truth surfaces (`npm ci`, `npm run build`, `npm test`) with stable exit behavior?

Yes.

The workflow does not add linting, release automation, matrix builds,
or extra status commands. It runs exactly the install/build/test
surface that the repo currently treats as truth, and the local witness
re-runs those same commands directly.

## Outcome

The hill is met for the first slice. METHOD now has a real automated CI
gate for this repo, and the repo-visible documentation matches the
workflow it ships.
