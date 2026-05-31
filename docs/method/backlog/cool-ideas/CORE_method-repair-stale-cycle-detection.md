---
title: "Method repair should detect stale cycles from rename migrations"
legend: CORE
lane: cool-ideas
---

# Method repair should detect stale cycles from rename migrations

When `method repair` renames retro directories (e.g. from numbered prefixes to legend-prefixed names), the renamed directories appear as new "active cycles" in `method_status` because they have design/retro structure but no proper closure marker. This creates noise — graft currently shows 35 "active" cycles that are actually closed historical work.

Repair should detect these stale cycles and either auto-close them or flag them for one-click closure.
