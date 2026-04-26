---
title: "Workspace initialization should accept existing METHOD signpost aliases"
legend: PROCESS
lane: bad-code
owner: "METHOD maintainers"
priority: high
acceptance_criteria:
  - "A workspace with docs/METHOD.md, docs/method/process.md, and docs/method/release.md is accepted as initialized when the rest of the METHOD directories exist."
  - "The test fixture below is represented explicitly in tests and fails before the fix."
  - "MCP tools that call Workspace.ensureInitialized(), including method_status, method_capture_witness, and method_drift, no longer report this fixture as 'not a METHOD workspace'."
  - "The canonical docs/PROCESS.md and docs/RELEASE.md layout still passes unchanged."
  - "The error message names the specific missing required paths when a workspace is truly uninitialized."
---

# Workspace Initialization Should Accept Existing METHOD Signpost Aliases

`Workspace.ensureInitialized()` currently hard-codes the v2 signpost
layout:

```text
CHANGELOG.md
docs/method/backlog/
docs/design/
docs/method/retro/
docs/PROCESS.md
docs/RELEASE.md
```

That makes MCP tools reject repos that have a valid METHOD filesystem
but use the older or repo-local signpost layout:

```text
docs/METHOD.md
docs/method/process.md
docs/method/release.md
```

Observed symptom from `git-warp`:

```text
/Users/james/git/git-stunts/git-warp is not a METHOD workspace.
Run `method init` first.
```

That repo has a real METHOD backlog, design directory, retro directory,
legends, and process docs. Running `method init` would be the wrong
advice because it would add generic scaffold signposts instead of
recognizing the existing repo-truth docs.

## Required Test Fixture Shape

Write a unit test that creates this exact fixture tree:

```text
workspace/
  CHANGELOG.md
  docs/
    METHOD.md
    design/
      .gitkeep
    method/
      process.md
      release.md
      backlog/
        inbox/
          .gitkeep
        asap/
          .gitkeep
        up-next/
          .gitkeep
        bad-code/
          .gitkeep
        cool-ideas/
          .gitkeep
      retro/
        .gitkeep
      graveyard/
        .gitkeep
      legends/
        .gitkeep
```

Do **not** create these files in the fixture:

```text
docs/PROCESS.md
docs/RELEASE.md
```

The test should assert the existing fixture is accepted:

```ts
const workspace = new Workspace(root);

expect(() => workspace.status()).not.toThrow();
```

If the MCP surface is tested separately, call the same path through
`method_status` and assert `ok: true`.

## Expected Fix Shape

Make initialization recognition accept either signpost set:

```text
canonical v2:
  docs/PROCESS.md
  docs/RELEASE.md

existing alias layout:
  docs/METHOD.md
  docs/method/process.md
  docs/method/release.md
```

The shared structural requirements should remain:

```text
CHANGELOG.md
docs/method/backlog/
docs/design/
docs/method/retro/
```

Do not weaken the workspace check into "any docs directory exists".
This should be a precise compatibility rule for real METHOD workspaces.

## Error Message Improvement

When a workspace is truly uninitialized, report the missing paths rather
than only saying:

```text
Run `method init` first.
```

Useful shape:

```text
<root> is not a METHOD workspace.
Missing required paths:
- docs/method/backlog/
- docs/design/
- docs/method/retro/
Missing one required signpost set:
- docs/PROCESS.md + docs/RELEASE.md
- OR docs/METHOD.md + docs/method/process.md + docs/method/release.md
```

That lets agents distinguish "run init" from "this repo uses a valid
alternate signpost layout."

