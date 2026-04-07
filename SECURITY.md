# Security

## Reporting a Vulnerability

If you discover a security vulnerability in METHOD, please report it
responsibly.

**Do not open a public issue.** Instead, email the maintainer directly
or use GitHub's private vulnerability reporting feature at
https://github.com/flyingrobots/method/security/advisories/new.

You should receive a response within 72 hours. If the vulnerability is
confirmed, a fix will be prioritized and a security advisory published
once the fix is available.

## Scope

METHOD is a development workflow tool. Its security surface includes:

- **CLI commands** that read and write to the local filesystem.
- **MCP server** that exposes workspace operations over stdio.
- **GitHub adapter** that authenticates with the GitHub API using tokens
  from `.method.json` or environment variables.

## Secrets

METHOD uses OS-native keychains for secrets management via
`@git-stunts/vault` when available. GitHub tokens in `.method.json`
should be treated as sensitive — ensure `.method.json` is in
`.gitignore` if it contains credentials.

## Supported Versions

Only the latest release is actively supported with security fixes.
