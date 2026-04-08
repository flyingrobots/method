---
title: "BEARING Truthfulness"
legend: PROCESS
lane: bad-code
---

# BEARING Truthfulness

`renderBearing` currently emits factual claims that have drifted from the
repo. In particular, it still says witness generation is not automated
even though automated witness capture already landed. A generated
signpost that tells the truth incorrectly is worse than missing
automation: it creates confident drift in the repo's own public surface.

This needs a pass to make BEARING generation derive more of its claims
from current repo state or explicitly constrain which statements are
allowed to be hardcoded.
