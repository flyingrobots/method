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
    '| `ARCHITECTURE.md` | Hand-authored | How the source code is organized. |',
    '| `docs/BEARING.md` | Generated | Current direction and recent ships. |',
    '| `docs/VISION.md` | Generated | Bounded executive synthesis. |',
    '| `docs/CLI.md` | Generated | CLI command reference. |',
    '| `docs/MCP.md` | Generated | MCP tool reference. |',
    '| `docs/GUIDE.md` | Hybrid | Operator advice with generated sections. |',
    '',
  ];
  return lines.join('\n');
}
