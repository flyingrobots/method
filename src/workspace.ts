import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { headerBox, separator } from '@flyingrobots/bijou';
import { createNodeContext } from '@flyingrobots/bijou-node';
import type { Outcome } from './cli-args.js';
import { detectWorkspaceDrift, type DriftReport } from './drift.js';
import { MethodError } from './errors.js';

const LANES = ['inbox', 'asap', 'up-next', 'cool-ideas', 'bad-code'] as const;
const BACKLOG_DIR = 'docs/method/backlog';
const DESIGN_DIR = 'docs/design';
const RETRO_DIR = 'docs/method/retro';
const LEGEND_PATTERN = /^(?<legend>[A-Z][A-Z0-9]*)_(?<slug>.+)$/;
const CYCLE_PATTERN = /^(?<number>\d{4})-(?<slug>[a-z0-9][a-z0-9-]*)$/;

export interface Cycle {
  name: string;
  number: number;
  slug: string;
  designDoc: string;
  retroDoc: string;
}

export function initWorkspace(root: string): { created: string[] } {
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
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, content, 'utf8');
      created.push(relative(root, file));
    }
  }

  return { created };
}

export class Workspace {
  readonly root: string;

  constructor(root: string) {
    this.root = root;
  }

  ensureInitialized(): void {
    const requiredPaths = [
      resolve(this.root, 'CHANGELOG.md'),
      resolve(this.root, BACKLOG_DIR),
      resolve(this.root, DESIGN_DIR),
      resolve(this.root, RETRO_DIR),
      resolve(this.root, 'docs/method/process.md'),
      resolve(this.root, 'docs/method/release.md'),
    ];
    if (requiredPaths.some((path) => !existsSync(path))) {
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
      if (!/^[A-Z][A-Z0-9]*$/u.test(normalized)) {
        throw new MethodError('Legend codes must be uppercase letters and numbers.');
      }
      prefix = `${normalized}_`;
    }

    const path = resolve(this.root, BACKLOG_DIR, 'inbox', `${prefix}${slug}.md`);
    if (existsSync(path)) {
      throw new MethodError(`${relative(this.root, path)} already exists. Use --title to disambiguate.`);
    }

    mkdirSync(dirname(path), { recursive: true });
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

  detectDrift(cycleName?: string): DriftReport {
    const cycles = cycleName === undefined ? this.openCycles() : [this.resolveCycle(cycleName)];
    return detectWorkspaceDrift(this.root, cycles);
  }

  renderStatus(ctx: ReturnType<typeof createNodeContext>): string {
    const backlogLines = [
      ...LANES.map((lane) => {
        const items = collectMarkdownFiles(resolve(this.root, BACKLOG_DIR, lane));
        return `${lane.padEnd(10, ' ')} ${String(items.length).padStart(2, ' ')}  ${items.map((item) => fileStem(item)).join(', ') || '-'}`;
      }),
      (() => {
        const rootItems = collectMarkdownFiles(resolve(this.root, BACKLOG_DIR))
          .filter((file) => dirname(file) === resolve(this.root, BACKLOG_DIR));
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

  openCycles(): Cycle[] {
    return this.allCycles().filter((cycle) => existsSync(cycle.designDoc) && !existsSync(cycle.retroDoc));
  }

  private resolveBacklogItem(item: string): string {
    const direct = resolve(this.root, item);
    if (existsSync(direct)) {
      return direct;
    }

    const backlogFiles = collectMarkdownFiles(resolve(this.root, BACKLOG_DIR));
    const exactMatches = backlogFiles.filter((file) => file === direct || basename(file) === item || fileStem(file) === item);
    if (exactMatches.length === 1) {
      return exactMatches[0];
    }
    if (exactMatches.length > 1) {
      throw new MethodError(`Ambiguous backlog item ${JSON.stringify(item)}: ${exactMatches.map((file) => relative(this.root, file)).join(', ')}`);
    }

    const lowerItem = item.toLowerCase();
    const fuzzyMatches = backlogFiles.filter((file) => fileStem(file).toLowerCase() === lowerItem);
    if (fuzzyMatches.length === 1) {
      return fuzzyMatches[0];
    }
    throw new MethodError(`Could not find backlog item ${JSON.stringify(item)}.`);
  }

  private nextCycleNumber(): number {
    const numbers = this.allCycles().map((cycle) => cycle.number);
    return numbers.length === 0 ? 1 : Math.max(...numbers) + 1;
  }

  private allCycles(): Cycle[] {
    const cycles = new Map<string, Cycle>();
    for (const base of [resolve(this.root, DESIGN_DIR), resolve(this.root, RETRO_DIR)]) {
      if (!existsSync(base)) {
        continue;
      }
      for (const entry of readdirSync(base, { withFileTypes: true })) {
        if (!entry.isDirectory()) {
          continue;
        }
        const match = CYCLE_PATTERN.exec(entry.name);
        if (match?.groups === undefined) {
          continue;
        }
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

  private resolveCycle(cycleName?: string): Cycle {
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
    if (matches.length === 1) {
      return matches[0];
    }
    if (matches.length > 1) {
      throw new MethodError(`Ambiguous cycle ${JSON.stringify(cycleName)}: ${matches.map((cycle) => cycle.name).join(', ')}`);
    }
    throw new MethodError(`Could not find active cycle ${JSON.stringify(cycleName)}.`);
  }

  private legendHealth(activeCycles: readonly Cycle[]): Map<string, { backlog: number; active: number }> {
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
  if (!existsSync(root)) {
    return [];
  }

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
  if (match?.groups === undefined) {
    return { slug: stem };
  }
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
    if (!line.startsWith('Legend: ')) {
      continue;
    }
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
