---
title: "Verification Witness for Cycle 28"
---

# Verification Witness for Cycle 28

This witness proves that `Hybrid Signpost Generation` now carries the required
behavior and adheres to the repo invariants.

## Test Results

```
> method@0.2.0 test
> vitest run --config vitest.config.ts


 RUN  v4.1.2 ./method


 Test Files  12 passed (12)
      Tests  127 passed (127)
   Start at  22:56:15
   Duration  987ms (transform 884ms, setup 0ms, import 2.85s, tests 1.05s, environment 1ms)
```

## Drift Results

```
Playback-question drift found.
Scanned 1 active cycle, 6 playback questions, 140 test descriptions.
Search basis: exact normalized match in tests/**/*.test.* and tests/**/*.spec.* descriptions.

docs/design/0028-hybrid-signpost-generation/hybrid-signpost-generation.md
- Human: Ship sync replaces content between generate markers without touching surrounding prose.
  Near miss: "replaces content between generate markers without touching surrounding prose"
- Human: CLI.md, MCP.md, and GUIDE.md use generate markers for their reference sections.
  No exact normalized test description match found.
- Human: Hand-written content outside markers survives regeneration.
  No exact normalized test description match found.
- Agent: A `replaceGeneratedSections` function finds marker pairs and replaces their content using a registry of named generators.
  No exact normalized test description match found.
- Agent: Generators exist for `cli-commands`, `mcp-tools`, and `signpost-inventory`.
  No exact normalized test description match found.
- Agent: Tests prove markers are respected and content outside is preserved.
  No exact normalized test description match found.
```

## Manual Verification

- [x] Automated capture completed successfully.
