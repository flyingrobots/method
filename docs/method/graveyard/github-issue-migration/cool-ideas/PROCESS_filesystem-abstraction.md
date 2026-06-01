---
title: "Filesystem Abstraction"
legend: PROCESS
lane: cool-ideas
---

# Filesystem Abstraction

Every method in Workspace calls readFileSync, writeFileSync, existsSync
etc. directly. No filesystem abstraction exists. This means:

- Tests must create real temp directories
- Cannot test filesystem error conditions (disk full, permissions)
- Cannot run in browser or worker environments
- collectMarkdownFiles has no depth limit protection

A FileSystem interface with default Node implementation would improve
testability and portability. Workspace constructor would accept an
optional FileSystem parameter.
