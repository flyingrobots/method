---
title: "Generated Doc Scaffold Contract"
legend: PROCESS
lane: up-next
---

# Generated Doc Scaffold Contract

`method pull` and `method close` still generate design and retro
documents with older scaffold shapes that do not match the repo's
current frontmatter contract. The committed docs suite enforces YAML
frontmatter and required fields on real docs, but the command-generated
templates do not yet guarantee those same invariants.

That means METHOD can generate docs that its own repo doctrine would
reject if they were committed. The scaffolders and the tests need to be
brought back into parity so generated docs are valid by construction.
