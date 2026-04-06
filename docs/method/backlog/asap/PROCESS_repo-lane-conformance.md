# METHOD repos should either contain declared backlog lanes or say they are optional

METHOD defines backlog lanes in `README.md`, but the repo itself can
drift from that declared shape. This repo did not contain `asap/` until
real work needed it.

That mismatch is small, but it weakens METHOD's claim that the
filesystem is the coordination layer.

Question to settle:
- are declared lanes required repo structure?
- or are they optional until first use?

Either answer is fine, but the method should be explicit.

Deliverable:
- choose the rule
- update docs to match
- optionally add a lightweight repo-conformance check or checklist for
  METHOD repos so missing lanes/signposts are caught early
