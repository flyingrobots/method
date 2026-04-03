# Git branch workflow policy

METHOD should define a git branch naming and workflow policy that is
clear enough for humans and agents to follow without improvising. Right
now the repo has doctrine for cycles, backlog lanes, retros, and
witnesses, but branch creation, branch naming, local `main` hygiene,
push policy, and PR expectations are still implicit.

Session context:

- Recent work in `method` exposed repeated uncertainty around branch
  handling: whether to work directly on `main`, when to branch for a
  cycle, how to name PR branches versus cycle branches, whether backlog
  triage belongs on a side branch, and when local `main` should be
  synced or left alone.
- External tool defaults also pushed their own assumptions into the
  repo, such as draft PRs, title prefixes, and PR-oriented workflow
  conventions that did not actually come from METHOD.
- At the same time, the repo has a clear stance that METHOD is not a
  GitHub workflow or a PR cockpit. So whatever policy exists should be
  git-aware and forge-aware, but not forge-dependent doctrine.

Questions this policy should answer:

- When should work happen directly on `main`, and when should it happen
  on a branch?
- Should active cycles default to branches named after the cycle, such
  as `0006-ci-gates`, or is that optional?
- What naming forms are valid for maintenance branches, backlog triage,
  review follow-up, or one-off operator work?
- What is the expected lifecycle for local `main` after PR merges?
- When is a PR required, preferred, or unnecessary?
- How should agents avoid silently importing external workflow
  conventions that the repo did not choose?
- How should this policy relate to optional sidecars like Draft Punks
  Doghouse without making METHOD itself a forge-specific system?

What this surfaced:

- METHOD needs branch/workflow doctrine, not just filesystem doctrine.
- The policy should distinguish cycle branches, temporary operator
  branches, and direct-maintenance cases.
- The policy should remain forge-agnostic at the core, even if a repo
  uses GitHub or tools like Doghouse in practice.
- A likely rule from recent practice: close the cycle packet on the
  branch before review (design, tests, playback, retro, witness), then
  do repo-level ship sync such as `BEARING.md` and `CHANGELOG.md` on
  `main` after merge.
