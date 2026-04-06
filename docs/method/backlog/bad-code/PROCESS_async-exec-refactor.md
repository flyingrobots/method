---
title: "Async Exec Refactor"
legend: PROCESS
---

# Async Exec Refactor

The `Workspace.execCommand` method currently uses synchronous `execSync`, 
which blocks the event loop and makes the CLI feel stuttery during 
witness capture.

## Success Criteria

- Replace `execSync` with an asynchronous implementation (e.g., using 
  `child_process.spawn` or `exec` wrapped in Promises).
- Preserve existing behavior for `METHOD_TEST` inputs.
- Match current stdout/stderr output format exactly on both success 
  and error.
- Support a configurable timeout and cooperative cancellation (accepting 
  an `AbortSignal` or timeout ms).
- Preserve exit-code semantics and ensure identical error messages are 
  thrown.
- Add unit/integration tests verifying the async API shape (returning 
  `{ stdout, stderr, code }`) and timeout cancellation behavior.
