---
title: "Verification Witness for Cycle 27"
---

# Verification Witness for Cycle 27

This witness proves that `Generated Reference Signposts` now carries the required
behavior and adheres to the repo invariants.

## Test Results

```
> method@0.2.0 test
> vitest run --config vitest.config.ts


 RUN  v4.1.2 ./method


 Test Files  11 passed (11)
      Tests  122 passed (122)
   Start at  22:18:58
   Duration  758ms (transform 770ms, setup 0ms, import 2.25s, tests 906ms, environment 1ms)
```

## Drift Results

```
Playback-question drift found.
Scanned 1 active cycle, 6 playback questions, 135 test descriptions.
Search basis: exact normalized match in tests/**/*.test.* and tests/**/*.spec.* descriptions.

docs/design/0027-generated-reference-signposts/generated-reference-signposts.md
- Human: `method sync ship` regenerates CLI.md and MCP.md alongside BEARING and CHANGELOG.
  No exact normalized test description match found.
- Human: The generated docs match the actual CLI usage and MCP tool schemas.
  No exact normalized test description match found.
- Agent: A `generateCliReference` function produces CLI.md from the usage() output in cli-args.ts.
  No exact normalized test description match found.
- Agent: A `generateMcpReference` function produces MCP.md from the tool schemas in mcp.ts.
  No exact normalized test description match found.
- Agent: Both carry `generated_from_commit` in frontmatter.
  No exact normalized test description match found.
- Agent: Tests prove the generated content names every command and tool.
  No exact normalized test description match found.
```

## Manual Verification

- [x] Automated capture completed successfully.
