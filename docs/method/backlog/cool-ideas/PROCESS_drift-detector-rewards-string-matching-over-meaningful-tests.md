---
title: Drift detector rewards string-matching over meaningful tests
legend: PROCESS
lane: cool-ideas
---

# Drift detector rewards string-matching over meaningful tests

Tests were written this session whose only purpose was to string-match a playback question — adding zero value beyond satisfying the drift detector. The drift detector should evaluate whether behavior is tested, not whether a test description matches a question string. Consider: if the playback question is 'Does the build clean dist?' and a test named 'build hygiene' asserts rm -rf dist in the script, that should count.
