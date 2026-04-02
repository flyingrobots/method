# Method CLI

What if Method had a CLI? Filesystem operations with guardrails.

- `method init` — scaffold the directory structure
- `method inbox "raw idea"` — drop a file in inbox/
- `method pull <item>` — move from backlog, create cycle dir, committed
- `method close` — run the retro checklist, prompt for drift check
- `method status` — show backlog by lane, active cycle, legend health

Could also be an MCP server so agents interact with the backlog
programmatically. Natural fit for agent-as-peer — the agent doesn't
need to remember the directory conventions, just calls the tool.
