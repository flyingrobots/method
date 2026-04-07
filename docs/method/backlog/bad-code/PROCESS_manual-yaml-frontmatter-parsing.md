---
title: "Manual YAML Frontmatter Parsing"
legend: PROCESS
lane: bad-code
---

# Manual YAML Frontmatter Parsing

`updateFrontmatter()` and `readFrontmatter()` in `src/index.ts` use
string slicing instead of a YAML library. Breaks on quoted values,
multi-line values, duplicate keys, Windows line endings.

Also: `updateFrontmatter()` creates regex from keys without escaping
metacharacters (line 325).

Fix: Use `yaml` or `js-yaml` package for YAML parse/serialize.
