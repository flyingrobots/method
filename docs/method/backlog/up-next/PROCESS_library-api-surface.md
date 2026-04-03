# Library API Surface

`method` already ships a real CLI, but it does not yet expose a clean
runtime-owned library surface that other repos or agent wrappers can
consume directly.

Session context:

- External repos are starting to want METHOD as infrastructure, not
  just as a standalone command-line tool.
- The current implementation already exports `runCli(...)`, which is a
  useful seam, but it is still a CLI-shaped API rather than a domain
  API.
- `src/cli.ts` is still carrying command parsing, workspace behavior,
  filesystem inspection, and rendering together, so API extraction is
  entangled with the existing module-split work.

What this surfaced:

- METHOD wants a `core` surface that returns structured results instead
  of terminal strings.
- The CLI should become a thin adapter over that core, not the only
  executable form of the system.
- A real API would make it possible to import METHOD in other repos, or
  wrap it with MCP, without shelling out and scraping human-oriented
  text.
- The boundary needs to be honest about what stays interactive
  operator-facing behavior and what becomes programmable runtime logic.
