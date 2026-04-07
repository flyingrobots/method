import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { exec, execSync } from 'node:child_process';
import { promisify } from 'node:util';
import { basename, dirname, relative, resolve } from 'node:path';
import {
  type BacklogItem,
  type Cycle,
  type Lane,
  LANES,
  type LegendHealth,
  type Outcome,
  type WorkspaceStatus,
} from './domain.js';
import { DEFAULT_PATHS, loadConfig, type Config, type PathsConfig } from './config.js';
import { detectWorkspaceDrift, type DriftReport } from './drift.js';
import { MethodError } from './errors.js';
import { createGenerators, replaceGeneratedSections } from './generate.js';

export interface ResolvedPaths {
  backlog: string;
  design: string;
  retro: string;
  tests: string;
  graveyard: string;
  methodDir: string;
}

function resolvePaths(root: string, paths: PathsConfig): ResolvedPaths {
  return {
    backlog: resolve(root, paths.backlog),
    design: resolve(root, paths.design),
    retro: resolve(root, paths.retro),
    tests: resolve(root, paths.tests),
    graveyard: resolve(root, paths.graveyard),
    methodDir: resolve(root, paths.method_dir),
  };
}

const LEGEND_PATTERN = /^(?<legend>[A-Z][A-Z0-9]*)_(?<slug>.+)$/;
const CYCLE_PATTERN = /^(?<number>\d{4})-(?<slug>[a-z0-9][a-z0-9-]*)$/;

export function initWorkspace(root: string, pathsConfig?: PathsConfig): { created: string[] } {
  const p = resolvePaths(root, pathsConfig ?? DEFAULT_PATHS);
  const directories = [
    resolve(p.backlog, 'inbox'),
    resolve(p.backlog, 'asap'),
    resolve(p.backlog, 'up-next'),
    resolve(p.backlog, 'cool-ideas'),
    resolve(p.backlog, 'bad-code'),
    resolve(p.methodDir, 'legends'),
    p.graveyard,
    resolve(p.methodDir, 'releases'),
    p.retro,
    resolve(root, 'docs/releases'),
    p.design,
  ];
  const files = new Map<string, string>([
    [resolve(root, 'CHANGELOG.md'), '# Changelog\n\n## Unreleased\n\n- No externally meaningful changes recorded yet.\n'],
    [resolve(p.methodDir, 'process.md'), '# Process\n\nDescribe how cycles run in this repository.\n'],
    [resolve(p.methodDir, 'release.md'), '# Release\n\nDescribe when and how externally meaningful releases ship.\n'],
    [resolve(p.methodDir, 'release-runbook.md'), '# Release Runbook\n\nDescribe the sequential release pre-flight for this repository.\n'],
    [resolve(p.methodDir, 'releases/README.md'), '# Release Packets\n\nStore internal release design and verification artifacts here.\n'],
    [resolve(root, 'docs/releases/README.md'), '# Releases\n\nStore user-facing release notes and migration guides here.\n'],
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
  readonly config: Config;
  readonly paths: ResolvedPaths;

  constructor(root: string) {
    this.root = root;
    this.config = loadConfig(root);
    this.paths = resolvePaths(root, this.config.paths);
  }

  ensureInitialized(): void {
    const requiredPaths = [
      resolve(this.root, 'CHANGELOG.md'),
      this.paths.backlog,
      this.paths.design,
      this.paths.retro,
      resolve(this.paths.methodDir, 'process.md'),
      resolve(this.paths.methodDir, 'release.md'),
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

    const path = resolve(this.paths.backlog, 'inbox', `${prefix}${slug}.md`);
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
    const designDir = resolve(this.paths.design, cycleName);
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
      retroDoc: resolve(this.paths.retro, cycleName, `${slug}.md`),
    };
  }

  async closeCycle(cycleName: string | undefined, completedDriftCheck: boolean, outcome?: Outcome): Promise<Cycle> {
    if (!completedDriftCheck) {
      throw new MethodError('Cannot close a cycle without completing the drift check.');
    }

    const cycle = this.resolveCycle(cycleName);
    const retroDir = resolve(this.paths.retro, cycle.name);
    const witnessDir = resolve(retroDir, 'witness');
    mkdirSync(witnessDir, { recursive: true });

    if (existsSync(cycle.retroDoc)) {
      throw new MethodError(`${relative(this.root, cycle.retroDoc)} already exists.`);
    }

    // Capture witness while the cycle is still technically "active" (retro doc doesn't exist yet)
    await this.captureWitness(cycle.name);

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
    return detectWorkspaceDrift(this.root, cycles, this.paths.tests);
  }

  shipSync(): { updated: string[]; newShips: Cycle[] } {
    const changelogPath = resolve(this.root, 'CHANGELOG.md');
    const bearingPath = resolve(this.root, 'docs/BEARING.md');
    const status = this.status();
    const closedCycles = this.allCycles().filter((cycle) => existsSync(cycle.retroDoc));
    const commitSha = this.currentCommitSha();

    const newShips = this.findNewShips(closedCycles);
    const updated: string[] = [];

    if (newShips.length > 0) {
      this.updateChangelog(changelogPath, newShips);
      updated.push('CHANGELOG.md');
    }

    writeFileSync(bearingPath, renderBearing(status, closedCycles, commitSha), 'utf8');
    updated.push('docs/BEARING.md');

    // Hybrid generation: replace <!-- generate:NAME --> sections in signpost files
    const generators = createGenerators(this.root);

    for (const signpost of ['ARCHITECTURE.md', 'docs/CLI.md', 'docs/MCP.md', 'docs/GUIDE.md']) {
      const signpostPath = resolve(this.root, signpost);
      if (!existsSync(signpostPath)) {
        continue;
      }
      const before = readFileSync(signpostPath, 'utf8');
      const after = replaceGeneratedSections(before, generators);
      if (after !== before) {
        writeFileSync(signpostPath, after, 'utf8');
        updated.push(signpost);
      }
    }

    return { updated, newShips };
  }

  private currentCommitSha(): string {
    try {
      return execSync('git rev-parse HEAD', { cwd: this.root, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    } catch {
      return 'unknown';
    }
  }

  async captureWitness(cycleName?: string): Promise<string> {
    const cycle = this.resolveCycle(cycleName);
    const retroDir = resolve(this.paths.retro, cycle.name);
    const witnessPath = resolve(retroDir, 'witness', 'verification.md');

    mkdirSync(dirname(witnessPath), { recursive: true });

    const testResult = await this.execCommand('npm test');
    const driftResult = await this.execCommand(`tsx src/cli.ts drift ${cycle.name}`);

    const content = renderWitnessDoc({
      cycle,
      testResult,
      driftResult,
    });

    writeFileSync(witnessPath, content, 'utf8');
    return witnessPath;
  }

  status(): WorkspaceStatus {
    const backlog: WorkspaceStatus['backlog'] = {
      inbox: [],
      asap: [],
      'up-next': [],
      'cool-ideas': [],
      'bad-code': [],
      root: [],
    };

    for (const lane of LANES) {
      backlog[lane] = this.collectBacklogItems(resolve(this.paths.backlog, lane), lane);
    }
    backlog.root = this.collectBacklogItems(this.paths.backlog, 'root', false);

    const activeCycles = this.openCycles();
    const legendHealth = this.calculateLegendHealth(activeCycles);

    return {
      root: this.root,
      backlog,
      activeCycles,
      legendHealth,
    };
  }

  updateFrontmatter(path: string, updates: Record<string, string>): void {
    const fullPath = resolve(this.root, path);
    const content = readFileSync(fullPath, 'utf8');
    let newContent = content;

    if (content.startsWith('---\n')) {
      const end = content.indexOf('\n---\n', 4);
      if (end !== -1) {
        let frontmatter = content.slice(4, end);
        for (const [key, value] of Object.entries(updates)) {
          const regex = new RegExp(`^${key}:.*$`, 'mu');
          if (regex.test(frontmatter)) {
            frontmatter = frontmatter.replace(regex, `${key}: ${value}`);
          } else {
            frontmatter = `${frontmatter}\n${key}: ${value}`;
          }
        }
        newContent = `---\n${frontmatter.trim()}\n---\n${content.slice(end + 5)}`;
      }
    } else {
      let frontmatter = '';
      for (const [key, value] of Object.entries(updates)) {
        frontmatter += `${key}: ${value}\n`;
      }
      newContent = `---\n${frontmatter.trim()}\n---\n\n${content}`;
    }

    writeFileSync(fullPath, newContent, 'utf8');
  }

  readFrontmatter(path: string): Record<string, string> {
    const fullPath = resolve(this.root, path);
    const content = readFileSync(fullPath, 'utf8');
    const result: Record<string, string> = {};

    if (content.startsWith('---\n')) {
      const end = content.indexOf('\n---\n', 4);
      if (end !== -1) {
        const frontmatter = content.slice(4, end);
        const lines = frontmatter.split('\n');
        for (const line of lines) {
          const match = /^([a-z0-9_]+):\s*(.*)$/u.exec(line.trim());
          if (match !== null) {
            result[match[1] ?? ''] = (match[2] ?? '').trim();
          }
        }
      }
    }

    return result;
  }

  updateBody(path: string, newBody: string): void {
    const fullPath = resolve(this.root, path);
    const content = readFileSync(fullPath, 'utf8');
    let frontmatter = '';

    if (content.startsWith('---\n')) {
      const end = content.indexOf('\n---\n', 4);
      if (end !== -1) {
        frontmatter = content.slice(0, end + 5);
      }
    }

    const title = readHeading(fullPath);
    const newContent = frontmatter 
      ? `${frontmatter}\n# ${title}\n\n${newBody.trim()}\n`
      : `# ${title}\n\n${newBody.trim()}\n`;
    writeFileSync(fullPath, newContent, 'utf8');
  }

  moveBacklogItem(path: string, targetLane: Lane | 'graveyard'): string {
    const fullPath = resolve(this.root, path);
    if (!existsSync(fullPath)) {
      throw new MethodError(`Backlog item not found: ${path}`);
    }

    const fileName = basename(fullPath);
    let targetDir: string;
    if (targetLane === 'graveyard') {
      targetDir = this.paths.graveyard;
    } else if (targetLane === 'root') {
      targetDir = this.paths.backlog;
    } else {
      targetDir = resolve(this.paths.backlog, targetLane);
    }
    
    mkdirSync(targetDir, { recursive: true });
    const targetPath = resolve(targetDir, fileName);
    
    if (fullPath === targetPath) {
      return relative(this.root, targetPath);
    }

    if (existsSync(targetPath)) {
      throw new MethodError(`Destination already exists: ${relative(this.root, targetPath)}`);
    }

    renameSync(fullPath, targetPath);
    return relative(this.root, targetPath);
  }

  openCycles(): Cycle[] {
    return this.allCycles().filter((cycle) => existsSync(cycle.designDoc) && !existsSync(cycle.retroDoc));
  }

  private findNewShips(closedCycles: Cycle[]): Cycle[] {
    const changelogPath = resolve(this.root, 'CHANGELOG.md');
    if (!existsSync(changelogPath)) {
      return closedCycles;
    }
    const content = readFileSync(changelogPath, 'utf8');
    return closedCycles.filter((cycle) => !content.includes(`- ${cycle.name}:`) && !content.includes(`(${cycle.name})`));
  }

  private updateChangelog(path: string, newShips: Cycle[]): void {
    const content = readFileSync(path, 'utf8');
    const lines = content.split('\n');
    const unreleasedIndex = lines.findIndex((line) => line.startsWith('## Unreleased'));
    if (unreleasedIndex === -1) {
      return;
    }

    const newEntries = newShips.map((cycle) => {
      const title = readHeading(cycle.designDoc) || titleCase(cycle.slug);
      return `- ${title} (${cycle.name})`;
    });

    lines.splice(unreleasedIndex + 2, 0, ...newEntries);
    writeFileSync(path, lines.join('\n'), 'utf8');
  }

  private resolveBacklogItem(item: string): string {
    const direct = resolve(this.root, item);
    if (existsSync(direct)) {
      return direct;
    }

    const backlogFiles = collectMarkdownFiles(this.paths.backlog);
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
    for (const base of [this.paths.design, this.paths.retro]) {
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
          designDoc: resolve(this.paths.design, entry.name, `${slug}.md`),
          retroDoc: resolve(this.paths.retro, entry.name, `${slug}.md`),
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

  private collectBacklogItems(dir: string, lane: Lane | 'root', recursive = true): BacklogItem[] {
    if (!existsSync(dir)) {
      return [];
    }
    const files = recursive ? collectMarkdownFiles(dir) : readdirSync(dir, { withFileTypes: true })
      .filter(e => e.isFile() && e.name.endsWith('.md'))
      .map(e => resolve(dir, e.name));
    
    return files.map(file => {
      const stem = fileStem(file);
      const { legend, slug } = splitLegend(stem);
      return {
        stem,
        lane,
        path: relative(this.root, file),
        legend,
        slug
      };
    });
  }

  private calculateLegendHealth(activeCycles: readonly Cycle[]): LegendHealth[] {
    const counts = new Map<string, { backlog: number; active: number }>();
    for (const file of collectMarkdownFiles(this.paths.backlog)) {
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

    return [...counts.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([legend, counts]) => ({
        legend,
        ...counts
      }));
  }

  async execCommand(command: string, options?: { timeoutMs?: number }): Promise<string> {
    if (process.env.METHOD_TEST === 'true') {
      return `[MOCK] Output for ${command}`;
    }
    const execAsync = promisify(exec);
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: this.root,
        encoding: 'utf8',
        timeout: options?.timeoutMs,
      });
      return stdout + stderr;
    } catch (error: any) {
      if (error.killed || error.signal === 'SIGTERM') {
        throw new MethodError(`Command timed out: ${command}`);
      }
      return (error.stdout ?? '') + (error.stderr ?? '');
    }
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

function renderBearing(status: WorkspaceStatus, closedCycles: Cycle[], commitSha: string): string {
  const latestShips = [...closedCycles].reverse().slice(0, 3);
  const nextUp = [...status.backlog.asap, ...status.backlog['up-next']].slice(0, 2);

  const priority = nextUp.length > 0 ? nextUp.map(i => `\`${i.stem}\``).join(' or ') : 'TBD';

  const shipLines = latestShips.map(cycle => {
    const title = readHeading(cycle.designDoc) || titleCase(cycle.slug);
    return `- \`${cycle.name}\`: ${title}`;
  });

  return [
    '---',
    'title: "BEARING"',
    `generated_at: ${new Date().toISOString()}`,
    'generator: "method sync ship (renderBearing)"',
    `generated_from_commit: "${commitSha}"`,
    'provenance_level: artifact_history',
    '---',
    '',
    '# BEARING',
    '',
    'This signpost summarizes direction. It does not create commitments or',
    'replace backlog items, design docs, retros, or CLI status.',
    '',
    '## Where are we going?',
    '',
    `Current priority: pull ${priority} to continue the system's maturity.`,
    '',
    '## What just shipped?',
    '',
    ...shipLines,
    '',
    '## What feels wrong?',
    '',
    '- Backlog maintenance is still largely manual.',
    '- Witness generation is not yet automated.',
    '',
  ].join('\n');
}

function renderWitnessDoc(options: {
  cycle: Cycle;
  testResult: string;
  driftResult: string;
}): string {
  const title = readHeading(options.cycle.designDoc) || titleCase(options.cycle.slug);
  return [
    '---',
    `title: "Verification Witness for Cycle ${options.cycle.number}"`,
    '---',
    '',
    `# Verification Witness for Cycle ${options.cycle.number}`,
    '',
    `This witness proves that \`${title}\` now carries the required`,
    'behavior and adheres to the repo invariants.',
    '',
    '## Test Results',
    '',
    '```',
    options.testResult.trim(),
    '```',
    '',
    '## Drift Results',
    '',
    '```',
    options.driftResult.trim(),
    '```',
    '',
    '## Manual Verification',
    '',
    '- [x] Automated capture completed successfully.',
    '',
  ].join('\n');
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

export function readHeading(path: string): string {
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/u)) {
    if (line.startsWith('# ')) {
      return line.slice(2).trim();
    }
  }
  return '';
}

export function readBody(path: string): string {
  const content = readFileSync(path, 'utf8');
  let body = content;

  // Strip YAML frontmatter
  if (content.startsWith('---\n')) {
    const end = content.indexOf('\n---\n', 4);
    if (end !== -1) {
      body = content.slice(end + 5);
    }
  }

  const lines = body.trim().split(/\r?\n/u);
  const bodyLines = lines[0]?.startsWith('# ') ? lines.slice(1) : lines;
  const result = bodyLines.join('\n').trim();
  return result.length > 0 ? result : 'TBD';
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

function fileStem(path: string): string {
  const name = basename(path);
  return name.endsWith('.md') ? name.slice(0, -3) : name;
}
