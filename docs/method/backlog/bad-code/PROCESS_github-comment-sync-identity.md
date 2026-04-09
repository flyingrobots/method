---
title: "GitHub Comment Sync Identity"
legend: PROCESS
lane: bad-code
---

# GitHub Comment Sync Identity

GitHub comment synchronization is still additive-only and uses simple
string matching to avoid duplicates instead of tracking stable remote
comment identity. That makes sync behavior approximate and brittle:
similar edits can duplicate, true edits cannot reconcile cleanly, and
agents do not get a durable mapping between repo state and remote review
discussion.

This needs real comment identity tracking rather than textual heuristics.
