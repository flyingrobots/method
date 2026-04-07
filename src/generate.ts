import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CLI_TOPICS, usage } from './cli-args.js';
import { MCP_TOOLS } from './mcp.js';

export type GeneratorFn = () => string;
export type GeneratorRegistry = Record<string, GeneratorFn>;

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
    '| `README.md` | Hand-authored | Core doctrine and filesystem shape. |',
    '| `ARCHITECTURE.md` | Hybrid | How the source code is organized. |',
    '| `docs/BEARING.md` | Generated | Current direction and recent ships. |',
    '| `docs/VISION.md` | Generated | Bounded executive synthesis. |',
    '| `docs/CLI.md` | Hybrid | CLI command reference. |',
    '| `docs/MCP.md` | Hybrid | MCP tool reference. |',
    '| `docs/GUIDE.md` | Hybrid | Operator advice with generated sections. |',
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
