---
title: "Signpost Template Overrides"
legend: PROCESS
lane: cool-ideas
---

# Signpost Template Overrides

Generated signposts currently hardcode repo voice and section content in
renderer code. For example, `renderBearing` bakes in the "What feels
wrong?" bullets directly, which makes repo-specific customization or
experimentation require code changes instead of configuration or
template-level overrides.

A lightweight signpost-template system could let repos keep METHOD's
structure while customizing selected generated sections. That would make
signpost generation less rigid, reduce pressure to fork the tool for
small wording changes, and open the door to agent-focused variants such
as concise machine-readable sections alongside human-oriented prose.
