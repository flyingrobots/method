---
title: "Remote Issue Deletion Sync"
legend: PROCESS
lane: cool-ideas
---

# Remote Issue Deletion Sync

Support an explicit policy for what METHOD should do when a synced remote
issue is deleted or otherwise disappears. Today that case is mostly a
silent edge, but a real sync layer should decide whether to archive the
local item, warn loudly, or preserve it with a remote-tombstone marker.
