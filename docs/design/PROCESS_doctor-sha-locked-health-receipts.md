---
title: "Doctor SHA-locked health receipts"
legend: "PROCESS"
cycle: "PROCESS_doctor-sha-locked-health-receipts"
source_backlog: "docs/method/backlog/asap/PROCESS_doctor-sha-locked-health-receipts.md"
---

# Doctor SHA-locked health receipts

## Hill

`method doctor --receipt` produces a JSON receipt anchored to the
current commit SHA, so release gates can verify the doctor pass matches
the exact state being shipped.

## Playback Questions

### Human

- [ ] Does `method doctor --receipt` produce a JSON receipt containing the commit SHA and health status?

### Agent

- [ ] Does `generateDoctorReceipt` return a receipt with commit_sha, status, and checks?
