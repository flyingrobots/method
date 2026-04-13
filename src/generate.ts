import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { CLI_TOPICS, usage } from './cli-args.js';
import { MCP_TOOLS } from './mcp.js';

export type GeneratorFn = () => string;
export type GeneratorRegistry = Record<string, GeneratorFn>;
export type SignpostKind = 'Hand-authored' | 'Hybrid' | 'Generated';
export type SignpostInitStrategy = 'reference-doc' | 'bearing';
export interface SignpostSpec {
  name: string;
  path: string;
  kind: SignpostKind;
  description: string;
  initStrategy?: SignpostInitStrategy;
}

export const SIGNPOST_SPECS: readonly SignpostSpec[] = [
  { name: 'README', path: 'README.md', kind: 'Hand-authored', description: 'Core doctrine and filesystem shape.' },
  { name: 'ARCHITECTURE', path: 'ARCHITECTURE.md', kind: 'Hybrid', description: 'How the source code is organized.', initStrategy: 'reference-doc' },
  { name: 'BEARING', path: 'docs/BEARING.md', kind: 'Generated', description: 'Current direction and recent ships.', initStrategy: 'bearing' },
  { name: 'VISION', path: 'docs/VISION.md', kind: 'Generated', description: 'Bounded executive synthesis.' },
  { name: 'CLI', path: 'docs/CLI.md', kind: 'Hybrid', description: 'CLI command reference.', initStrategy: 'reference-doc' },
  { name: 'MCP', path: 'docs/MCP.md', kind: 'Hybrid', description: 'MCP tool reference.', initStrategy: 'reference-doc' },
  { name: 'GUIDE', path: 'docs/GUIDE.md', kind: 'Hybrid', description: 'Operator advice with generated sections.', initStrategy: 'reference-doc' },
] as const;

export const REFERENCE_DOC_TARGETS = [
  'ARCHITECTURE.md',
  'docs/CLI.md',
  'docs/MCP.md',
  'docs/GUIDE.md',
] as const;

const REFERENCE_DOC_TEMPLATES: Record<(typeof REFERENCE_DOC_TARGETS)[number], string> = {
  'ARCHITECTURE.md': [
    '---',
    'title: "Architecture"',
    'generator: "method sync refs"',
    'provenance_level: artifact_history',
    '---',
    '',
    '# Architecture',
    '',
    'METHOD is a TypeScript CLI and library that implements the METHOD',
    'development workflow.',
    '',
    '## Source Layout',
    '',
    '<!-- generate:source-layout -->',
    '<!-- /generate -->',
    '',
    '## Key Modules',
    '',
    '### `index.ts` — Workspace',
    '',
    'The `Workspace` class owns backlog operations, cycle lifecycle,',
    'reference sync, ship sync, and status.',
    '',
    '### `cli.ts` — CLI Entry Point',
    '',
    'Dispatches commands parsed by `cli-args.ts`.',
    '',
    '### `mcp.ts` — MCP Server',
    '',
    'Exposes the same workspace operations through MCP tools.',
    '',
  ].join('\n'),
  'docs/CLI.md': [
    '---',
    'title: CLI Reference',
    'generator: method sync refs',
    'provenance_level: artifact_history',
    '---',
    '',
    '# CLI Reference',
    '',
    'The `method` command is the primary interface for METHOD workspace',
    'operations. Run `method help` for a quick summary or',
    '`method help <command>` for command-specific usage.',
    '',
    '## Commands',
    '',
    '<!-- generate:cli-commands -->',
    '<!-- /generate -->',
    '',
    '## Configuration',
    '',
    'The CLI reads `.method.json` from the workspace root for:',
    '',
    '- `paths` — custom directory layout (see `ARCHITECTURE.md`)',
    '- `github_token` / `github_repo` — GitHub adapter credentials',
    '- Environment overrides: `GITHUB_TOKEN`, `GITHUB_REPO`',
    '',
  ].join('\n'),
  'docs/MCP.md': [
    '---',
    'title: MCP Reference',
    'generator: method sync refs',
    'provenance_level: artifact_history',
    '---',
    '',
    '# MCP Reference',
    '',
    'METHOD exposes its workspace operations through a Model Context',
    'Protocol (MCP) server. Start it with `method mcp`.',
    '',
    '## Workspace Parameter',
    '',
    'Every tool requires a `workspace` parameter: the absolute path to the',
    'METHOD workspace root directory.',
    '',
    '## Tools',
    '',
    '<!-- generate:mcp-tools -->',
    '<!-- /generate -->',
    '',
    '## Error Handling',
    '',
    'All tools return a human-readable text message in `content`.',
    'Machine-readable callers should consume `structuredContent`.',
    '',
  ].join('\n'),
  'docs/GUIDE.md': [
    '---',
    'title: "Guide"',
    'generator: "method sync refs"',
    'provenance_level: artifact_history',
    '---',
    '',
    '# Guide',
    '',
    'This document holds practical advice for working in a METHOD repo.',
    '',
    '## Signposts',
    '',
    '<!-- generate:signpost-inventory -->',
    '<!-- /generate -->',
    '',
  ].join('\n'),
};

const MARKER_PATTERN = /<!-- generate:(\S+) -->\n[\s\S]*?<!-- \/generate -->/gu;

export function replaceGeneratedSections(
  content: string,
  generators: GeneratorRegistry,
): string {
  return content.replace(MARKER_PATTERN, (match, name: string) => {
    const generator = generators[name];
    if (generator === undefined) {
      return match;
    }
    const generated = generator();
    return `<!-- generate:${name} -->\n${generated}<!-- /generate -->`;
  });
}

export function createGenerators(root: string): GeneratorRegistry {
  return {
    'cli-commands': cliCommandsGenerator,
    'mcp-tools': mcpToolsGenerator,
    'signpost-inventory': signpostInventoryGenerator,
    'source-layout': () => sourceLayoutGenerator(root),
    'test-summary': () => testSummaryGenerator(root),
    'dependencies': () => dependenciesGenerator(root),
  };
}

export function generateReferenceDocs(root: string): { targets: string[]; updated: string[] } {
  const generators = createGenerators(root);
  const targets: string[] = [];
  const updated: string[] = [];

  for (const signpost of REFERENCE_DOC_TARGETS) {
    const signpostPath = resolve(root, signpost);
    if (!existsSync(signpostPath)) {
      mkdirSync(dirname(signpostPath), { recursive: true });
      writeFileSync(signpostPath, REFERENCE_DOC_TEMPLATES[signpost], 'utf8');
    }

    targets.push(signpost);
    const before = readFileSync(signpostPath, 'utf8');
    const after = replaceGeneratedSections(before, generators);
    if (after !== before) {
      writeFileSync(signpostPath, after, 'utf8');
      updated.push(signpost);
    }
  }

  return { targets, updated };
}

export function initializeReferenceDoc(root: string, target: (typeof REFERENCE_DOC_TARGETS)[number]): { path: string; initialized: boolean } {
  const signpostPath = resolve(root, target);
  if (existsSync(signpostPath)) {
    return { path: target, initialized: false };
  }

  mkdirSync(dirname(signpostPath), { recursive: true });
  const content = replaceGeneratedSections(REFERENCE_DOC_TEMPLATES[target], createGenerators(root));
  writeFileSync(signpostPath, content, 'utf8');
  return { path: target, initialized: true };
}

export function resolveSignpostSpec(query: string): SignpostSpec | undefined {
  const normalized = query.trim();
  if (normalized.length === 0) {
    return undefined;
  }

  const upper = normalized.toUpperCase();
  return SIGNPOST_SPECS.find((spec) =>
    spec.name === upper
    || spec.path === normalized
    || spec.path.toUpperCase() === upper
    || spec.path.split('/').at(-1)?.toUpperCase() === upper
  );
}

export function cliCommandsGenerator(): string {
  const lines: string[] = [];
  for (const topic of CLI_TOPICS) {
    const text = usage(topic);
    const usageLine = text.split('\n')[0] ?? '';
    const description = text.split('\n').slice(1).filter((l) => l.trim().length > 0);
    lines.push(`### \`${usageLine.replace(/^Usage: /u, '')}\``);
    lines.push('');
    for (const line of description) {
      lines.push(line);
    }
    if (description.length > 0) {
      lines.push('');
    }
  }
  lines.push('### Exit Codes');
  lines.push('');
  lines.push('| Code | Meaning |');
  lines.push('|------|---------|');
  lines.push('| 0 | Success |');
  lines.push('| 1 | Error (bad arguments, missing workspace, failed operation) |');
  lines.push('| 2 | Drift found (from `method drift`) |');
  lines.push('');
  return lines.join('\n');
}

export function mcpToolsGenerator(): string {
  const lines: string[] = [];
  for (const tool of MCP_TOOLS) {
    lines.push(`### \`${tool.name}\``);
    lines.push('');
    lines.push(tool.description);
    lines.push('');

    const params = Object.entries(tool.inputSchema.properties)
      .filter(([key]) => key !== 'workspace');
    const required = new Set(tool.inputSchema.required.filter((k) => k !== 'workspace'));

    if (params.length > 0) {
      lines.push('**Parameters:**');
      lines.push('');
      for (const [key, schema] of params) {
        const req = required.has(key) ? '(required)' : '(optional)';
        const desc = ('description' in schema && schema.description) ? ` — ${schema.description}` : '';
        const enumValues = ('enum' in schema && schema.enum) ? ` (${schema.enum.join(', ')})` : '';
        lines.push(`- \`${key}\` ${req} \`${schema.type}\`${enumValues}${desc}`);
      }
      lines.push('');
    }
  }
  return lines.join('\n');
}

export function signpostInventoryGenerator(): string {
  const lines: string[] = [
    '| Signpost | Type | Description |',
    '|----------|------|-------------|',
    ...SIGNPOST_SPECS.map((spec) => `| \`${spec.path}\` | ${spec.kind} | ${spec.description} |`),
    '',
  ];
  return lines.join('\n');
}

function sourceLayoutGenerator(root: string): string {
  const srcDir = resolve(root, 'src');
  if (!existsSync(srcDir)) {
    return '(no src/ directory found)\n';
  }

  const lines: string[] = ['```', 'src/'];

  const entries = collectSourceEntries(srcDir, 'src');
  for (const entry of entries) {
    lines.push(entry);
  }

  lines.push('```');
  lines.push('');
  return lines.join('\n');
}

function collectSourceEntries(dir: string, prefix: string): string[] {
  const entries: string[] = [];
  const items = readdirSync(dir, { withFileTypes: true }).sort((a, b) => {
    // Directories first, then files
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name);
  });

  for (const item of items) {
    if (item.name.startsWith('.')) continue;
    if (item.isDirectory()) {
      entries.push(`  ${item.name}/`);
      const children = collectSourceEntries(resolve(dir, item.name), `${prefix}/${item.name}`);
      for (const child of children) {
        entries.push(`  ${child}`);
      }
    } else if (item.isFile() && /\.[cm]?[jt]sx?$/u.test(item.name)) {
      entries.push(`  ${item.name}`);
    }
  }

  return entries;
}

function testSummaryGenerator(root: string): string {
  const testsDir = resolve(root, 'tests');
  if (!existsSync(testsDir)) {
    return '(no tests/ directory found)\n';
  }

  const files = readdirSync(testsDir)
    .filter((f) => /\.(?:test|spec)\.[cm]?[jt]sx?$/u.test(f))
    .sort();

  const lines: string[] = [
    `${files.length} test files in \`tests/\` using Vitest:`,
    '',
    ...files.map((f) => `- \`${f}\``),
    '',
    'Each test file creates temp workspaces via `mkdtempSync` and cleans',
    'up in `afterEach`. The `METHOD_TEST=true` environment variable mocks',
    'shell command execution during witness capture.',
    '',
  ];

  return lines.join('\n');
}

function dependenciesGenerator(root: string): string {
  const pkgPath = resolve(root, 'package.json');
  if (!existsSync(pkgPath)) {
    return '(no package.json found)\n';
  }

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  const deps = Object.keys(pkg.dependencies ?? {}).sort();

  if (deps.length === 0) {
    return 'No runtime dependencies.\n';
  }

  const lines: string[] = deps.map((d) => `- \`${d}\``);
  lines.push('');
  return lines.join('\n');
}
