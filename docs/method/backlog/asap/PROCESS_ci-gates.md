# CI Gates

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

What this surfaced:

- CI is infrastructure truth, not optional decoration.
- The first cut can stay narrow: build plus tests.
- Later cycles can add stronger checks, but the repo should stop
  pretending manual verification is enough for merge safety.
