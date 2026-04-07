---
title: "Unvalidated GitHub API Responses"
legend: PROCESS
lane: bad-code
---

# Unvalidated GitHub API Responses

`mapIssue()` in `src/adapters/github.ts` casts GitHub API responses
to `any` without validation. A malformed response crashes with an
unhelpful error.

Fix: Add a Zod schema for GitHub API responses and validate in
mapIssue() before mapping.
