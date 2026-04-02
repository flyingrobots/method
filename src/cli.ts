#!/usr/bin/env node

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { alert, confirm, headerBox, separator } from '@flyingrobots/bijou';
import { createNodeContext } from '@flyingrobots/bijou-node';

const LANES = ['inbox', 'asap', 'up-next', 'cool-ideas', 'bad-code'] as const;
const BACKLOG_DIR = 'docs/method/backlog';
const DESIGN_DIR = 'docs/design';
const RETRO_DIR = 'docs/method/retro';
const LEGEND_PATTERN = /^(?<legend>[A-Z][A-Z0-9]*)_(?<slug>.+)$/;
const CYCLE_PATTERN = /^(?<number>\d{4})-(?<slug>[a-z0-9][a-z0-9-]*)$/;

type Writer = Pick<NodeJS.WritableStream, 'write'>;

type ParsedCommand =
  | { command: 'help'; topic?: string }
  | { command: 'init'; path: string }
  | { command: 'inbox'; idea: string; legend?: string; title?: string }
  | { command: 'pull'; item: string }
  | { command: 'close'; cycle?: string; driftCheck?: 'yes' | 'no'; outcome?: Outcome }
  | { command: 'status' };

type Outcome = 'hill-met' | 'partial' | 'not-met';

type ConfirmPrompt = (options: { title: string; defaultValue: boolean }) => Promise<boolean>;

export interface RunCliOptions {
  cwd?: string;
  stdout?: Writer;
  stderr?: Writer;
  confirmPrompt?: ConfirmPrompt;
}

interface Cycle {
  name: string;
  number: number;
  slug: string;
  designDoc: string;
  retroDoc: string;
}

class MethodError extends Error {}

export async function runCli(
  argv: readonly string[],
  options: RunCliOptions = {},
): Promise<number> {
  const root = resolve(options.cwd ?? process.cwd());
  const stdout = options.stdout ?? process.stdout;
  const stderr = options.stderr ?? process.stderr;
  const ctx = createNodeContext();
  const promptConfirm = options.confirmPrompt
    ?? ((promptOptions) => confirm({ title: promptOptions.title, defaultValue: promptOptions.defaultValue, ctx }));

  try {
    const parsed = parseCliArgs(argv);
    if (parsed.command === 'help') {
      stdout.write(`${usage(parsed.topic)}\n`);
      return 0;
    }

    if (parsed.command === 'init') {
      const target = resolve(root, parsed.path);
      const result = initWorkspace(target);
      stdout.write(`${alert(`Initialized METHOD workspace at ${target}`, { variant: 'success', ctx })}\n`);
      if (result.created.length > 0) {
        stdout.write(`${result.created.map((entry) => `- ${entry}`).join('\n')}\n`);
      }
      return 0;
    }

    const workspace = new Workspace(root);
    workspace.ensureInitialized();

    if (parsed.command === 'inbox') {
      const created = workspace.captureIdea(parsed.idea, parsed.legend, parsed.title);
      stdout.write(`${alert(`Captured ${relative(root, created)}`, { variant: 'success', ctx })}\n`);
      return 0;
    }

    if (parsed.command === 'pull') {
      const cycle = workspace.pullItem(parsed.item);
      stdout.write(`${alert(`Pulled into ${cycle.name}`, { variant: 'success', ctx })}\n`);
      stdout.write(`${relative(root, cycle.designDoc)}\n`);
      return 0;
    }

    if (parsed.command === 'close') {
      const completedDriftCheck = parsed.driftCheck === undefined
        ? await promptConfirm({ title: 'Drift check complete?', defaultValue: false })
        : parsed.driftCheck === 'yes';
      const cycle = workspace.closeCycle(parsed.cycle, completedDriftCheck, parsed.outcome);
      stdout.write(`${alert(`Closed ${cycle.name}`, { variant: 'success', ctx })}\n`);
      stdout.write(`${relative(root, cycle.retroDoc)}\n`);
      return 0;
    }

    stdout.write(workspace.renderStatus(ctx));
    return 0;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    stderr.write(`${alert(message, { variant: 'error', ctx })}\n`);
    return 1;
  }
}

export async function main(argv: readonly string[] = process.argv.slice(2)): Promise<number> {
  return runCli(argv);
}

function parseCliArgs(argv: readonly string[]): ParsedCommand {
  const [command, ...rest] = argv;
  if (command === undefined || command === '--help' || command === '-h') {
    return { command: 'help' };
  }

  if (command === 'help') {
    if (rest.length > 1) {
      throw new MethodError('Usage: method help [command]');
    }
    return { command: 'help', topic: rest[0] };
  }

  if (rest.includes('--help') || rest.includes('-h')) {
    return { command: 'help', topic: command };
  }

  switch (command) {
    case 'init':
      return parseInitArgs(rest);
    case 'inbox':
      return parseInboxArgs(rest);
    case 'pull':
      return parsePullArgs(rest);
    case 'close':
      return parseCloseArgs(rest);
    case 'status':
      if (rest.length > 0) {
        throw new MethodError('`status` does not take any arguments.');
      }
      return { command: 'status' };
    default:
      throw new MethodError(`Unknown command: ${command}`);
  }
}

function parseInitArgs(args: readonly string[]): ParsedCommand {
  if (args.length > 1) {
    throw new MethodError('Usage: method init [path]');
  }
  return { command: 'init', path: args[0] ?? '.' };
}

function parseInboxArgs(args: readonly string[]): ParsedCommand {
  let legend: string | undefined;
  let title: string | undefined;
  const positionals: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value === '--legend') {
      legend = requireOptionValue(args, index, '--legend');
      index += 1;
      continue;
    }
    if (value.startsWith('--legend=')) {
      legend = value.slice('--legend='.length);
      continue;
    }
    if (value === '--title') {
      title = requireOptionValue(args, index, '--title');
      index += 1;
      continue;
    }
    if (value.startsWith('--title=')) {
      title = value.slice('--title='.length);
      continue;
    }
    if (value.startsWith('-')) {
      throw new MethodError(`Unknown option: ${value}`);
    }
    positionals.push(value);
  }

  if (positionals.length !== 1) {
    throw new MethodError('Usage: method inbox <idea> [--legend CODE] [--title TITLE]');
  }

  return { command: 'inbox', idea: positionals[0], legend, title };
}

function parsePullArgs(args: readonly string[]): ParsedCommand {
  if (args.length !== 1) {
    throw new MethodError('Usage: method pull <item>');
  }
  return { command: 'pull', item: args[0] };
}

function parseCloseArgs(args: readonly string[]): ParsedCommand {
  let cycle: string | undefined;
  let driftCheck: 'yes' | 'no' | undefined;
  let outcome: Outcome | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value === '--drift-check') {
      driftCheck = parseDriftCheckValue(requireOptionValue(args, index, '--drift-check'));
      index += 1;
      continue;
    }
    if (value.startsWith('--drift-check=')) {
      driftCheck = parseDriftCheckValue(value.slice('--drift-check='.length));
      continue;
    }
    if (value === '--outcome') {
      outcome = parseOutcomeValue(requireOptionValue(args, index, '--outcome'));
      index += 1;
      continue;
    }
    if (value.startsWith('--outcome=')) {
      outcome = parseOutcomeValue(value.slice('--outcome='.length));
      continue;
    }
    if (value.startsWith('-')) {
      throw new MethodError(`Unknown option: ${value}`);
    }
    if (cycle !== undefined) {
      throw new MethodError('Usage: method close [cycle] [--drift-check yes|no] [--outcome hill-met|partial|not-met]');
    }
    cycle = value;
  }

  return { command: 'close', cycle, driftCheck, outcome };
}

function requireOptionValue(args: readonly string[], index: number, optionName: string): string {
  const value = args[index + 1];
  if (value === undefined || value.startsWith('-')) {
    throw new MethodError(`${optionName} requires a value.`);
  }
  return value;
}

function parseDriftCheckValue(value: string): 'yes' | 'no' {
  if (value === 'yes' || value === 'no') return value;
  throw new MethodError('`--drift-check` must be `yes` or `no`.');
}

function parseOutcomeValue(value: string): Outcome {
  if (value === 'hill-met' || value === 'partial' || value === 'not-met') return value;
  throw new MethodError('`--outcome` must be `hill-met`, `partial`, or `not-met`.');
}

function usage(topic?: string): string {
  if (topic === 'init') {
    return 'Usage: method init [path]\n\nScaffold a METHOD workspace in the given directory.';
  }
  if (topic === 'inbox') {
    return 'Usage: method inbox <idea> [--legend CODE] [--title TITLE]\n\nCapture a raw idea in docs/method/backlog/inbox/.';
  }
  if (topic === 'pull') {
    return 'Usage: method pull <item>\n\nPromote a backlog item into the next numbered design cycle.';
  }
  if (topic === 'close') {
    return 'Usage: method close [cycle] [--drift-check yes|no] [--outcome hill-met|partial|not-met]\n\nClose an active cycle into docs/method/retro/.';
  }
  if (topic === 'status') {
    return 'Usage: method status\n\nShow backlog lanes, active cycles, and legend health.';
  }
  return [
    'Usage: method <command> [options]',
    '',
    'Commands:',
    '  init [path]                 Scaffold a METHOD workspace.',
    '  inbox <idea>                Capture a raw idea in inbox/.',
    '  pull <item>                 Promote a backlog item into a cycle.',
    '  close [cycle]               Write a retro for an active cycle.',
    '  status                      Show backlog, active cycles, and legend health.',
    '',
    'Run `method help <command>` for command-specific usage.',
  ].join('\n');
}

function initWorkspace(root: string): { created: string[] } {
  const directories = [
    resolve(root, BACKLOG_DIR, 'inbox'),
    resolve(root, BACKLOG_DIR, 'asap'),
    resolve(root, BACKLOG_DIR, 'up-next'),
    resolve(root, BACKLOG_DIR, 'cool-ideas'),
    resolve(root, BACKLOG_DIR, 'bad-code'),
    resolve(root, 'docs/method/legends'),
    resolve(root, 'docs/method/graveyard'),
    resolve(root, 'docs/method/retro'),
    resolve(root, DESIGN_DIR),
  ];
  const files = new Map<string, string>([
    [resolve(root, 'CHANGELOG.md'), '# Changelog\n\n## Unreleased\n\n- No externally meaningful changes recorded yet.\n'],
    [resolve(root, 'docs/method/process.md'), '# Process\n\nDescribe how cycles run in this repository.\n'],
    [resolve(root, 'docs/method/release.md'), '# Release\n\nDescribe when and how externally meaningful releases ship.\n'],
  ]);

  const created: string[] = [];
  for (const directory of directories) {
    if (!existsSync(directory)) {
      mkdirSync(directory, { recursive: true });
      created.push(relative(root, directory) || '.');
    } else {
      mkdirSync(directory, { recursive: true });
    }
  }

  for (const [file, content] of files) {
    if (!existsSync(file)) {
      mkdirSync(resolve(file, '..'), { recursive: true });
      writeFileSync(file, content, 'utf8');
      created.push(relative(root, file));
    }
  }

  return { created };
}

class Workspace {
  readonly root: string;

  constructor(root: string) {
    this.root = root;
  }

  ensureInitialized(): void {
    if (!existsSync(resolve(this.root, BACKLOG_DIR, 'inbox'))) {
      throw new MethodError(`${this.root} is not a METHOD workspace. Run \`method init\` first.`);
    }
  }

  captureIdea(idea: string, legend?: string, title?: string): string {
    const cleanIdea = idea.trim();
    if (cleanIdea.length === 0) {
      throw new MethodError('Idea cannot be empty.');
    }

    const slug = slugify(title ?? cleanIdea);
    if (slug.length === 0) {
      throw new MethodError('Could not derive a filename from the provided idea.');
    }

    let prefix = '';
    if (legend !== undefined) {
      const normalized = legend.trim().toUpperCase();
      if (!/^[A-Z][A-Z0-9]*$/.test(normalized)) {
        throw new MethodError('Legend codes must be uppercase letters and numbers.');
      }
      prefix = `${normalized}_`;
    }

    const path = resolve(this.root, BACKLOG_DIR, 'inbox', `${prefix}${slug}.md`);
    if (existsSync(path)) {
      throw new MethodError(`${relative(this.root, path)} already exists. Use --title to disambiguate.`);
    }

    const heading = (title ?? cleanIdea).trim();
    writeFileSync(path, `# ${heading}\n\n${cleanIdea}\n`, 'utf8');
    return path;
  }

  pullItem(item: string): Cycle {
    const backlogItem = this.resolveBacklogItem(item);
    const title = readHeading(backlogItem);
    if (title.length === 0) {
      throw new MethodError(`${relative(this.root, backlogItem)} is missing a heading.`);
    }

    const { legend, slug } = splitLegend(fileStem(backlogItem));
    const cycleName = `${String(this.nextCycleNumber()).padStart(4, '0')}-${slug}`;
    const designDir = resolve(this.root, DESIGN_DIR, cycleName);
    const designDoc = resolve(designDir, `${slug}.md`);
    if (existsSync(designDoc)) {
      throw new MethodError(`${relative(this.root, designDoc)} already exists.`);
    }

    mkdirSync(designDir, { recursive: false });
    writeFileSync(
      designDoc,
      renderDesignDoc({
        title,
        legend,
        source: relative(this.root, backlogItem),
        backlogBody: readBody(backlogItem),
      }),
      'utf8',
    );
    unlinkSync(backlogItem);

    return {
      name: cycleName,
      number: Number.parseInt(cycleName.slice(0, 4), 10),
      slug,
      designDoc,
      retroDoc: resolve(this.root, RETRO_DIR, cycleName, `${slug}.md`),
    };
  }

  closeCycle(cycleName: string | undefined, completedDriftCheck: boolean, outcome?: Outcome): Cycle {
    if (!completedDriftCheck) {
      throw new MethodError('Cannot close a cycle without completing the drift check.');
    }

    const cycle = this.resolveCycle(cycleName);
    const retroDir = resolve(this.root, RETRO_DIR, cycle.name);
    const witnessDir = resolve(retroDir, 'witness');
    mkdirSync(witnessDir, { recursive: true });
    if (existsSync(cycle.retroDoc)) {
      throw new MethodError(`${relative(this.root, cycle.retroDoc)} already exists.`);
    }

    writeFileSync(
      cycle.retroDoc,
      renderRetroDoc({
        cycle,
        root: this.root,
        outcome,
        witnessDir: relative(this.root, witnessDir),
      }),
      'utf8',
    );
    return cycle;
  }

  renderStatus(ctx: ReturnType<typeof createNodeContext>): string {
    const backlogLines = [
      ...LANES.map((lane) => {
        const items = collectMarkdownFiles(resolve(this.root, BACKLOG_DIR, lane));
        return `${lane.padEnd(10, ' ')} ${String(items.length).padStart(2, ' ')}  ${items.map((item) => fileStem(item)).join(', ') || '-'}`;
      }),
      (() => {
        const rootItems = collectMarkdownFiles(resolve(this.root, BACKLOG_DIR))
          .filter((file) => resolve(file, '..') === resolve(this.root, BACKLOG_DIR));
        return `${'root'.padEnd(10, ' ')} ${String(rootItems.length).padStart(2, ' ')}  ${rootItems.map((item) => fileStem(item)).join(', ') || '-'}`;
      })(),
    ];

    const activeCycles = this.openCycles();
    const cycleLines = activeCycles.length > 0
      ? activeCycles.map((cycle) => `${cycle.name.padEnd(18, ' ')} ${readHeading(cycle.designDoc) || cycle.slug}`)
      : ['-'];

    const legendCounts = this.legendHealth(activeCycles);
    const legendLines = legendCounts.size > 0
      ? [...legendCounts.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([legend, counts]) => `${legend.padEnd(8, ' ')} backlog=${counts.backlog} active=${counts.active}`)
      : ['-'];

    return [
      `${headerBox('METHOD Status', { detail: this.root, ctx })}`,
      '',
      `${separator({ label: 'Backlog', ctx })}`,
      ...backlogLines,
      '',
      `${separator({ label: 'Active Cycles', ctx })}`,
      ...cycleLines,
      '',
      `${separator({ label: 'Legend Health', ctx })}`,
      ...legendLines,
      '',
    ].join('\n');
  }

  resolveBacklogItem(item: string): string {
    const direct = resolve(this.root, item);
    if (existsSync(direct)) {
      return direct;
    }

    const backlogFiles = collectMarkdownFiles(resolve(this.root, BACKLOG_DIR));
    const exactMatches = backlogFiles.filter((file) => file === direct || basename(file) === item || fileStem(file) === item);
    if (exactMatches.length === 1) return exactMatches[0];
    if (exactMatches.length > 1) {
      throw new MethodError(`Ambiguous backlog item ${JSON.stringify(item)}: ${exactMatches.map((file) => relative(this.root, file)).join(', ')}`);
    }

    const lowerItem = item.toLowerCase();
    const fuzzyMatches = backlogFiles.filter((file) => fileStem(file).toLowerCase() === lowerItem);
    if (fuzzyMatches.length === 1) return fuzzyMatches[0];
    throw new MethodError(`Could not find backlog item ${JSON.stringify(item)}.`);
  }

  nextCycleNumber(): number {
    const numbers = this.allCycles().map((cycle) => cycle.number);
    return numbers.length === 0 ? 1 : Math.max(...numbers) + 1;
  }

  allCycles(): Cycle[] {
    const cycles = new Map<string, Cycle>();
    for (const base of [resolve(this.root, DESIGN_DIR), resolve(this.root, RETRO_DIR)]) {
      if (!existsSync(base)) continue;
      for (const entry of readdirSync(base, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const match = CYCLE_PATTERN.exec(entry.name);
        if (match?.groups === undefined) continue;
        const slug = match.groups.slug;
        const number = Number.parseInt(match.groups.number, 10);
        cycles.set(entry.name, {
          name: entry.name,
          number,
          slug,
          designDoc: resolve(this.root, DESIGN_DIR, entry.name, `${slug}.md`),
          retroDoc: resolve(this.root, RETRO_DIR, entry.name, `${slug}.md`),
        });
      }
    }
    return [...cycles.values()].sort((left, right) => left.number - right.number);
  }

  openCycles(): Cycle[] {
    return this.allCycles().filter((cycle) => existsSync(cycle.designDoc) && !existsSync(cycle.retroDoc));
  }

  resolveCycle(cycleName?: string): Cycle {
    const activeCycles = this.openCycles();
    if (activeCycles.length === 0) {
      throw new MethodError('No active cycles found.');
    }

    if (cycleName === undefined) {
      if (activeCycles.length > 1) {
        throw new MethodError(`Multiple active cycles found: ${activeCycles.map((cycle) => cycle.name).join(', ')}`);
      }
      return activeCycles[0];
    }

    const matches = activeCycles.filter((cycle) =>
      cycle.name === cycleName || cycle.slug === cycleName || cycle.name.endsWith(cycleName));
    if (matches.length === 1) return matches[0];
    if (matches.length > 1) {
      throw new MethodError(`Ambiguous cycle ${JSON.stringify(cycleName)}: ${matches.map((cycle) => cycle.name).join(', ')}`);
    }
    throw new MethodError(`Could not find active cycle ${JSON.stringify(cycleName)}.`);
  }

  legendHealth(activeCycles: readonly Cycle[]): Map<string, { backlog: number; active: number }> {
    const counts = new Map<string, { backlog: number; active: number }>();
    for (const file of collectMarkdownFiles(resolve(this.root, BACKLOG_DIR))) {
      const { legend } = splitLegend(fileStem(file));
      const key = legend ?? 'untagged';
      const current = counts.get(key) ?? { backlog: 0, active: 0 };
      current.backlog += 1;
      counts.set(key, current);
    }

    for (const cycle of activeCycles) {
      const key = readDesignLegend(cycle.designDoc) ?? 'untagged';
      const current = counts.get(key) ?? { backlog: 0, active: 0 };
      current.active += 1;
      counts.set(key, current);
    }

    return counts;
  }
}

function collectMarkdownFiles(root: string): string[] {
  if (!existsSync(root)) return [];
  const files: string[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = resolve(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectMarkdownFiles(path));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(path);
    }
  }
  return files.sort((left, right) => left.localeCompare(right));
}

function renderDesignDoc(options: {
  title: string;
  legend?: string;
  source: string;
  backlogBody: string;
}): string {
  const legendValue = options.legend ?? 'none';
  return [
    `# ${options.title}`,
    '',
    `Source backlog item: \`${options.source}\``,
    `Legend: ${legendValue}`,
    '',
    '## Sponsors',
    '',
    '- Human: TBD',
    '- Agent: TBD',
    '',
    '## Hill',
    '',
    'TBD',
    '',
    '## Playback Questions',
    '',
    '### Human',
    '',
    '- [ ] TBD',
    '',
    '### Agent',
    '',
    '- [ ] TBD',
    '',
    '## Accessibility and Assistive Reading',
    '',
    '- Linear truth / reduced-complexity posture: TBD',
    '- Non-visual or alternate-reading expectations: TBD',
    '',
    '## Localization and Directionality',
    '',
    '- Locale / wording / formatting assumptions: TBD',
    '- Logical direction / layout assumptions: TBD',
    '',
    '## Agent Inspectability and Explainability',
    '',
    '- What must be explicit and deterministic for agents: TBD',
    '- What must be attributable, evidenced, or governed: TBD',
    '',
    '## Non-goals',
    '',
    '- [ ] TBD',
    '',
    '## Backlog Context',
    '',
    options.backlogBody,
    '',
  ].join('\n');
}

function renderRetroDoc(options: {
  cycle: Cycle;
  root: string;
  outcome?: Outcome;
  witnessDir: string;
}): string {
  const title = readHeading(options.cycle.designDoc) || titleCase(options.cycle.slug);
  return [
    `# ${title} Retro`,
    '',
    `Design: \`${relative(options.root, options.cycle.designDoc)}\``,
    `Outcome: ${options.outcome ?? 'TBD'}`,
    'Drift check: yes',
    '',
    '## Summary',
    '',
    'TBD',
    '',
    '## Playback Witness',
    '',
    `Add artifacts under \`${options.witnessDir}\` and link them here.`,
    '',
    '## Drift',
    '',
    '- None recorded.',
    '',
    '## New Debt',
    '',
    '- None recorded.',
    '',
    '## Cool Ideas',
    '',
    '- None recorded.',
    '',
    '## Backlog Maintenance',
    '',
    '- [ ] Inbox processed',
    '- [ ] Priorities reviewed',
    '- [ ] Dead work buried or merged',
    '',
  ].join('\n');
}

function splitLegend(stem: string): { legend?: string; slug: string } {
  const match = LEGEND_PATTERN.exec(stem);
  if (match?.groups === undefined) return { slug: stem };
  return { legend: match.groups.legend, slug: match.groups.slug };
}

function readHeading(path: string): string {
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/u)) {
    if (line.startsWith('# ')) {
      return line.slice(2).trim();
    }
  }
  return '';
}

function readBody(path: string): string {
  const lines = readFileSync(path, 'utf8').split(/\r?\n/u);
  const bodyLines = lines[0]?.startsWith('# ') ? lines.slice(1) : lines;
  const body = bodyLines.join('\n').trim();
  return body.length > 0 ? body : 'TBD';
}

function readDesignLegend(path: string): string | undefined {
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/u)) {
    if (!line.startsWith('Legend: ')) continue;
    const value = line.slice('Legend: '.length).trim();
    return value === 'none' ? undefined : value;
  }
  return undefined;
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-+|-+$/gu, '');
}

function titleCase(value: string): string {
  return value
    .split('-')
    .filter((part) => part.length > 0)
    .map((part) => `${part[0].toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

function basename(path: string): string {
  return path.split('/').at(-1) ?? path;
}

function fileStem(path: string): string {
  const name = basename(path);
  return name.endsWith('.md') ? name.slice(0, -3) : name;
}

if (process.argv[1] !== undefined && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().then((code) => {
    process.exitCode = code;
  });
}
