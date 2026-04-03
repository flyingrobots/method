# CI Gates

Source backlog item: `docs/method/backlog/asap/PROCESS_ci-gates.md`
Legend: PROCESS

## Sponsors

- Human: I can push a branch or open a PR and get automatic proof that
  METHOD still builds and its tests still pass, without relying on
  memory or local-only verification.
- Agent: I can point to one committed CI workflow whose trigger
  surface, runtime, install mode, and commands match the repo's actual
  truth surfaces exactly.

## Hill

METHOD ships a minimal CI gate for this repo, implemented as a
GitHub Actions workflow that runs install, build, and tests on `push`
and `pull_request`, and documents that contract clearly in repo-visible
files.

## Playback Questions

### Human

- [ ] Can I inspect the repo and see which automated checks guard
      pushes and PRs, without reading chat history or relying on
      remembered local commands?
- [ ] If CI fails, does the workflow name the failing step clearly
      enough that I can reproduce it locally with the same commands?

### Agent

- [ ] Are the workflow triggers, Node version, dependency-install
      strategy, and executed commands explicit in committed files rather
      than hidden in GitHub settings or tool defaults?
- [ ] Does the first cut stay narrow and deterministic by running only
      the repo's current truth surfaces (`npm ci`, `npm run build`,
      `npm test`) with stable exit behavior?

## Accessibility and Assistive Reading

- Linear truth / reduced-complexity posture: the workflow and docs
  should read as plain text from top to bottom. Step names should be
  concise and action-shaped so a failure is understandable without
  badges, color, or GitHub UI chrome.
- Non-visual or alternate-reading expectations: the repo should state
  the CI commands and workflow path directly in prose so a screen-reader
  user, terminal-only operator, or agent can reconstruct the contract
  without parsing screenshots or badges.

## Localization and Directionality

- Locale / wording / formatting assumptions: first cut may use English
  workflow names and status wording. Localization of CI messages is not
  part of this cycle.
- Logical direction / layout assumptions: the contract should rely on
  textual step order and command names, not left/right layout or other
  direction-bound presentation.

## Agent Inspectability and Explainability

- What must be explicit and deterministic for agents: the workflow file
  path, triggers, Node version, cache/install behavior, and executed
  commands must all be committed in the repo. There should be no hidden
  logic in branch settings, local shell aliases, or chat-only policy.
- What must be attributable, evidenced, or governed: playback and
  closeout must be able to point to the workflow file, the commands it
  runs, and the local reproduction path. This cycle may note required
  GitHub settings, but it does not rely on hidden branch-protection
  state as proof.

## Non-goals

- [ ] Adding linting, formatting, or broader quality gates beyond the
      current build/test truth surfaces.
- [ ] Adding release, publish, or package-version automation.
- [ ] Adding a multi-OS or multi-version matrix. First cut should keep
      one explicit supported runtime.
- [ ] Generalizing CI across every forge or turning GitHub Actions into
      METHOD doctrine. This cycle is a repo-local adapter for this repo.
- [ ] Hardening CodeRabbit config or broader PR-review workflow policy.
      Those remain separate backlog items.

## Decisions To Make

- Which Node version the workflow should run in for the first cut.
  Final choice: run Node `22` only and align the repo support floor to
  that decision.
- Whether the workflow should run any METHOD-specific smoke command
  beyond build/test, or whether `npm run build` and `npm test` are the
  full first-cut contract.
- How much of the CI policy should be documented in `README.md` and
  `docs/BEARING.md` versus left implicit in the workflow file itself.

## Backlog Context

METHOD should not rely on a human remembering to run tests before
push or merge. Add a minimal CI workflow that runs the repo's actual
truth surfaces on `push` and `pull_request`: build, test, and any
required docs or status checks that are supposed to stay green.

Session context:

- During PR review of the `drift-detector` cycle, CodeRabbit called out
  the absence of CI as a contradiction: the repo claims strict review
  and drift discipline, but there is no automated gate for `npm test`
  or `npm run build`.
- That critique is right. METHOD should make the passing state
  reproducible and machine-checked, not dependent on operator memory.
- This repo already has a `package-lock.json`, so the first cut can use
  `npm ci` for deterministic dependency installation rather than
  open-ended install behavior.

What this surfaced:

- CI is infrastructure truth, not optional decoration.
- The first cut can stay narrow: build plus tests.
- Later cycles can add stronger checks, but the repo should stop
  pretending manual verification is enough for merge safety.
- METHOD itself should stay forge-agnostic, but this repo can still use
  GitHub Actions as its current host adapter.
