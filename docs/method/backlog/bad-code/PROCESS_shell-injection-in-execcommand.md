---
title: "Shell Injection in execCommand"
legend: PROCESS
lane: bad-code
---

# Shell Injection in execCommand

`execCommand()` in `src/index.ts` uses `exec()` which passes commands
through a shell. Cycle names are interpolated into command strings
without escaping:

```typescript
await this.execCommand(`tsx src/cli.ts drift ${cycle.name}`);
```

A malicious directory name could inject shell commands.

Fix: Replace `exec()` with `execFile()` and pass arguments as an array.
