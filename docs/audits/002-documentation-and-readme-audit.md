---
title: "Documentation & README Audit"
---

# Documentation & README Audit (Audit 002)

Date: 2026-04-07

---

## 1. ACCURACY & EFFECTIVENESS ASSESSMENT

### 1.1. Core Mismatch

The README Tooling section says:

```bash
npm run method -- status
```

This is the dev-mode invocation. But the tool is also `npm link`-able
as `method` globally, and the `package.json` has a `bin` entry. The
README never mentions global installation or `npx` usage. A user
reading the README would think the only way to run it is through
`npm run method --`.

The README also does not mention `.method.json` configuration anywhere
in its body text, despite this being the primary way to configure
paths, GitHub credentials, and workspace layout. The config is only
documented in `docs/CLI.md` and `ARCHITECTURE.md`.

### 1.2. Audience & Goal Alignment

**Primary audience:** Solo developers (human + agent) adopting METHOD
for their own repos.

**Top 3 questions this audience has:**

1. **"How do I start using this in my project?"** — Partially
   answered. `method init` is mentioned but there is no quickstart
   walkthrough showing the full first-cycle experience.

2. **"What does the day-to-day workflow look like?"** — Well answered.
   The loop section (steps 0-7) is clear and thorough.

3. **"How do I configure it for my project?"** — Not answered in
   README. Configuration is spread across CLI.md, ARCHITECTURE.md,
   and the config.ts source code.

### 1.3. Time-to-Value (TTV) Barrier

The biggest bottleneck: **no quickstart**. A new developer must read
~500 lines of README philosophy before finding the Tooling section.
The README is doctrine-first, not action-first. There is no "get
running in 60 seconds" path.

---

## 2. REQUIRED UPDATES & COMPLETENESS CHECK

### 2.1. README.md Priority Fixes

1. **Add a Quick Start section near the top** (after Principles, before
   Structure) that shows: `npm install`, `method init`, `method inbox`,
   `method status` — four commands to a working workspace.

2. **Add a Configuration section** that names `.method.json` as the
   config file, lists what it controls (paths, GitHub credentials),
   and links to `docs/CLI.md` for full reference.

3. **Update the Tooling section** to show both dev-mode (`npm run
   method --`) and installed-mode (`method`) invocations. Document
   `npm link` for local development.

### 2.2. Missing Standard Documentation

1. **`CODE_OF_CONDUCT.md`** — Standard for open-source projects.
   Missing entirely. Contributor Covenant is the typical choice.

2. **Getting Started / Tutorial** — `docs/GUIDE.md` exists but has
   only two advice notes. There is no end-to-end walkthrough of the
   first cycle. This is the most impactful missing doc for adoption.

### 2.3. Supplementary Documentation

The `.method.json` configuration system is undocumented outside of
source code. The `PathsSchema` in `config.ts` defines 6 configurable
paths plus GitHub credentials, all with defaults and Zod validation.
A dedicated "Configuration Reference" section in `docs/CLI.md` (or a
standalone `docs/CONFIG.md`) would save users from reading source.

---

## 3. FINAL ACTION PLAN

### 3.1. Recommendation Type: A (Incremental Update)

The README is well-written and thorough on doctrine. It needs targeted
additions, not a rewrite.

### 3.2. Deliverable

1. Add a Quick Start section to README.md after Principles.
2. Add a Configuration section to README.md before Tooling.
3. Update Tooling section with both invocation modes.
4. Add `CODE_OF_CONDUCT.md` (Contributor Covenant 2.1).
5. Expand `docs/GUIDE.md` with a first-cycle walkthrough.

### 3.3. Mitigation Prompt

> Add a "## Quick Start" section to README.md between Principles and
> Structure that shows four commands: `npm install`, `method init`,
> `method inbox "my first idea"`, `method status`. Add a
> "## Configuration" section before Tooling that documents
> `.method.json` with the paths and GitHub fields. Update the Tooling
> section to show `method status` (global) alongside
> `npm run method -- status` (dev). Create `CODE_OF_CONDUCT.md` using
> Contributor Covenant 2.1. Expand `docs/GUIDE.md` with a "Your First
> Cycle" walkthrough that goes from inbox to close.
