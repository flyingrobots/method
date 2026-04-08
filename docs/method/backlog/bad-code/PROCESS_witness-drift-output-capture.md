---
title: "Witness Drift Output Capture"
legend: PROCESS
lane: bad-code
---

# Witness Drift Output Capture

`captureWitness()` is still not reliably capturing the output of the
drift command into `verification.md`. During cycle `0031`, the standalone
`method drift 0031-generated-doc-scaffold-contract` command returned the
expected clean summary, but the generated witness still recorded an
empty `## Drift Results` block.

That is real repo-truth drift inside the witness packet itself. The
close flow is claiming automated evidence capture, but one of the key
artifacts is blank even when the source command had meaningful output.

This should be fixed with a targeted regression test so witness packets
carry the actual drift output they observed at close time.
