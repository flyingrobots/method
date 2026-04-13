import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import GitPlumbing from '@git-stunts/plumbing';
import { basename, dirname, isAbsolute, relative, resolve } from 'node:path';
import {
  type BacklogLane,
  type BacklogItem,
  type BacklogQueryItem,
  type BacklogQueryResult,
  type BacklogQuerySort,
  type Cycle,
  type Lane,
  LANES,
  SCAFFOLD_LANES,
  type NextWorkRecommendation,
  type NextWorkResult,
  type NextWorkScoreBand,
  type NextWorkSignal,
  orderedBacklogLaneNames,
  isReleaseLane,
  isLaneName,
  type LegendHealth,
  type Outcome,
  type WorkspaceStatus,
} from './domain.js';
import { DEFAULT_PATHS, loadConfig, type Config, type PathsConfig } from './config.js';
import { detectWorkspaceDrift, type DriftReport } from './drift.js';
import { MethodError } from './errors.js';
import {
  readBody as fmReadBody,
  readFrontmatter as fmReadFrontmatter,
  readHeading as fmReadHeading,
  readTypedFrontmatter as fmReadTypedFrontmatter,
  updateBody as fmUpdateBody,
  updateFrontmatter as fmUpdateFrontmatter,
  updateTypedFrontmatter as fmUpdateTypedFrontmatter,
} from './frontmatter.js';
import { generateReferenceDocs, initializeReferenceDoc, resolveSignpostSpec, SIGNPOST_SPECS } from './generate.js';
import { renderBearing, renderDesignDoc, renderRetroDoc, renderWitnessDoc, titleCase } from './renderers.js';
import {
  CYCLE_NAME_PATTERN,
  LEGACY_CYCLE_PATTERN,
  readCycleFromDoc,
  readCycleRelease,
  resolveCyclePacketPaths,
} from './cycle-ops.js';
import {
  assertWorkspacePath,
  collectMarkdownFiles,
  fileStem,
  normalizeOptionalString,
  normalizeRepoPath,
  slugify,
} from './workspace-utils.js';

export interface ResolvedPaths {
  backlog: string;
  design: string;
  retro: string;
  tests: string;
  graveyard: string;
  methodDir: string;
}

interface SignpostStatusEntry {
  name: string;
  path: string;
  kind: string;
  description: string;
  exists: boolean;
  initable: boolean;
}

export interface BacklogDependencyEdge {
  blocker: string;
  blocked: string;
}

export interface BacklogDependencyItem extends BacklogItem {
  title?: string;
  blockedBy: string[];
  blocks: string[];
  unresolvedBlockedBy: string[];
  unresolvedBlocks: string[];
  ready: boolean;
}

export interface BacklogDependencyFocus {
  item: BacklogDependencyItem;
  blockers: BacklogDependencyItem[];
  blocked: BacklogDependencyItem[];
  criticalPath: BacklogDependencyItem[];
  criticalPathReason?: string;
}

export interface BacklogDependencyReport {
  root: string;
  query: {
    item?: string;
    readyOnly: boolean;
    criticalPath: boolean;
  };
  items: BacklogDependencyItem[];
  edges: BacklogDependencyEdge[];
  ready: BacklogDependencyItem[];
  cycles: string[][];
  focus?: BacklogDependencyFocus;
}

export interface BacklogMetadataEditResult extends BacklogQueryItem {
  updatedFields: string[];
}

interface BearingSignals {
  exists: boolean;
  priority?: string;
  concerns: string[];
  sections: Array<{ name: string; text: string; lines: string[] }>;
}

interface RankedNextWorkItem {
  item: BacklogQueryItem;
  score: number;
  laneRank: number;
  signals: NextWorkSignal[];
  whyNow: string[];
  bearingOverride: boolean;
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

const LEGEND_CODE_PATTERN = /^[A-Z][A-Z0-9]*$/u;
const LEGEND_PATTERN = /^(?<legend>[A-Z][A-Z0-9]*)_(?<slug>.+)$/;
// CYCLE_NAME_PATTERN and LEGACY_CYCLE_PATTERN imported from ./cycle-ops.js
const FEEDBACK_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;

export function workspaceScaffold(root: string, pathsConfig: PathsConfig = DEFAULT_PATHS): { directories: string[]; files: Map<string, string> } {
  const p = resolvePaths(root, pathsConfig);
  return {
    directories: [
      ...SCAFFOLD_LANES.map((lane) => resolve(p.backlog, lane)),
      resolve(p.methodDir, 'legends'),
      p.graveyard,
      resolve(p.methodDir, 'releases'),
      p.retro,
      resolve(root, 'docs/releases'),
      p.design,
    ],
    files: new Map<string, string>([
      [resolve(root, 'CHANGELOG.md'), '# Changelog\n\n## Unreleased\n\n- No externally meaningful changes recorded yet.\n'],
      [resolve(p.methodDir, 'process.md'), '# Process\n\nDescribe how cycles run in this repository.\n'],
      [resolve(p.methodDir, 'release.md'), '# Release\n\nDescribe when and how externally meaningful releases ship.\n'],
      [resolve(p.methodDir, 'release-runbook.md'), '# Release Runbook\n\nDescribe the sequential release pre-flight for this repository.\n'],
      [resolve(p.methodDir, 'releases/README.md'), '# Release Packets\n\nStore internal release design and verification artifacts here.\n'],
      [resolve(root, 'docs/releases/README.md'), '# Releases\n\nStore user-facing release notes and migration guides here.\n'],
    ]),
  };
}

export function initWorkspace(root: string, pathsConfig?: PathsConfig): { created: string[] } {
  const { directories, files } = workspaceScaffold(root, pathsConfig ?? DEFAULT_PATHS);

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

  createBacklogItem(options: {
    lane: string;
    title: string;
    body?: string;
    legend?: string;
    source?: string;
    capturedAt?: string;
  }): string {
    const lane = normalizeLiveBacklogLane(options.lane);
    if (lane === undefined) {
      throw new MethodError('Backlog lane must be a live lane such as `inbox`, `bad-code`, or `v1.1.0`.');
    }

    const heading = options.title.trim();
    if (heading.length === 0) {
      throw new MethodError('Title cannot be empty.');
    }

    const slug = slugify(heading);
    if (slug.length === 0) {
      throw new MethodError('Could not derive a filename from the provided title.');
    }

    const normalizedLegend = normalizeRequestedLegend(options.legend);
    const prefix = normalizedLegend === undefined ? '' : `${normalizedLegend}_`;
    const path = resolve(this.paths.backlog, lane, `${prefix}${slug}.md`);
    if (existsSync(path)) {
      throw new MethodError(`${relative(this.root, path)} already exists. Change the title or legend to disambiguate.`);
    }

    mkdirSync(dirname(path), { recursive: true });
    const fmLines = ['---', `title: "${heading.replace(/"/gu, '\\"')}"`];
    if (normalizedLegend !== undefined) {
      fmLines.push(`legend: ${normalizedLegend}`);
    }
    const release = inferBacklogRelease(lane, undefined);
    if (release !== undefined) {
      fmLines.push(`release: "${release}"`);
    }
    if (options.source?.trim().length) {
      fmLines.push(`source: "${options.source.trim().replace(/"/gu, '\\"')}"`);
    }
    const capturedAt = normalizeCapturedAt(options.capturedAt);
    if (options.capturedAt !== undefined || options.source !== undefined) {
      fmLines.push(`captured_at: "${capturedAt}"`);
    }
    fmLines.push(`lane: ${lane}`, '---');

    const body = options.body?.trimEnd() ?? '';
    const content = body.length === 0
      ? `${fmLines.join('\n')}\n\n# ${heading}\n`
      : `${fmLines.join('\n')}\n\n# ${heading}\n\n${body}\n`;

    writeFileSync(path, content, 'utf8');
    return path;
  }

  captureIdea(idea: string, legend?: string, title?: string): string {
    return this.captureIdeaWithMetadata(idea, legend, title);
  }

  captureIdeaWithMetadata(idea: string, legend?: string, title?: string, metadata?: {
    source?: string;
    capturedAt?: string;
    body?: string;
  }): string {
    const cleanIdea = idea.trim();
    if (cleanIdea.length === 0) {
      throw new MethodError('Idea cannot be empty.');
    }

    return this.createBacklogItem({
      lane: 'inbox',
      title: (title ?? cleanIdea).trim(),
      body: metadata?.body ?? cleanIdea,
      legend,
      source: metadata?.source,
      capturedAt: metadata?.capturedAt,
    });
  }

  captureSpike(goal: string, title?: string, constraints?: string): string {
    const cleanGoal = goal.trim();
    if (cleanGoal.length === 0) {
      throw new MethodError('Spike goal cannot be empty.');
    }

    const heading = (title ?? cleanGoal).trim();
    const body = [
      cleanGoal,
      '',
      '## Stack Constraints',
      '',
      constraints?.trim() ?? 'TBD',
      '',
      '## Expected Outcome',
      '',
      'Prove the behavior or surface the constraint, then close with a',
      'retro explaining what was learned.',
    ].join('\n');

    return this.createBacklogItem({
      lane: 'inbox',
      title: heading,
      legend: 'SPIKE',
      body,
    });
  }

  pullItem(item: string): Cycle {
    const backlogItem = this.resolveBacklogItem(item);
    const title = readHeading(backlogItem);
    if (title.length === 0) {
      throw new MethodError(`${relative(this.root, backlogItem)} is missing a heading.`);
    }

    const { legend, slug, release } = readBacklogPullContext(backlogItem, inferBacklogLane(this.paths.backlog, backlogItem));
    const cycleName = legend !== undefined ? `${legend}_${slug}` : slug;
    const { designDoc, retroDoc } = resolveCyclePacketPaths(this.root, this.paths, cycleName, release);
    if (existsSync(designDoc)) {
      throw new MethodError(`${relative(this.root, designDoc)} already exists.`);
    }

    mkdirSync(dirname(designDoc), { recursive: true });
    writeFileSync(
      designDoc,
      renderDesignDoc({
        cycleName,
        title,
        legend,
        source: relative(this.root, backlogItem),
        backlogBody: readBody(backlogItem),
        release,
      }),
      'utf8',
    );
    unlinkSync(backlogItem);

    return {
      name: cycleName,
      slug,
      designDoc,
      retroDoc,
    };
  }

  async closeCycle(cycleName: string | undefined, completedDriftCheck: boolean, outcome: Outcome): Promise<Cycle> {
    if (!completedDriftCheck) {
      throw new MethodError('Cannot close a cycle without completing the drift check.');
    }

    const cycle = this.resolveCycle(cycleName);
    const retroDir = dirname(cycle.retroDoc);
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
        release: readCycleRelease(cycle),
      }),
      'utf8',
    );

    return cycle;
  }

  detectDrift(cycleName?: string): DriftReport {
    const cycles = cycleName === undefined ? this.openCycles() : [this.resolveCycle(cycleName)];
    return detectWorkspaceDrift(this.root, cycles, this.paths.tests, this.config.drift_thresholds);
  }

  syncRefs(): { targets: string[]; updated: string[] } {
    return generateReferenceDocs(this.root);
  }

  signpostStatus() {
    const signposts = SIGNPOST_SPECS.map((spec): SignpostStatusEntry => ({
      name: spec.name,
      path: spec.path,
      kind: spec.kind,
      description: spec.description,
      exists: existsSync(resolve(this.root, spec.path)),
      initable: spec.initStrategy !== undefined,
    }));

    return {
      root: this.root,
      signposts,
      missing: signposts.filter((signpost) => !signpost.exists).map((signpost) => signpost.path),
      present: signposts.filter((signpost) => signpost.exists).map((signpost) => signpost.path),
    };
  }

  async initSignpost(name: string) {
    const spec = resolveSignpostSpec(name);
    if (spec === undefined) {
      throw new MethodError(`Unknown signpost ${JSON.stringify(name)}. Use one of: ${SIGNPOST_SPECS.map((entry) => entry.name).join(', ')}`);
    }
    if (spec.initStrategy === undefined) {
      throw new MethodError(`Signpost ${spec.name} is not initable. Current helpers support: ${SIGNPOST_SPECS.filter((entry) => entry.initStrategy !== undefined).map((entry) => entry.name).join(', ')}`);
    }
    if (existsSync(resolve(this.root, spec.path))) {
      return {
        ok: true,
        requested: spec.name,
        initializedTargets: [],
        skippedPaths: [spec.path],
        signpost: this.signpostStatus().signposts.find((entry) => entry.path === spec.path)!,
      };
    }

    if (spec.initStrategy === 'reference-doc') {
      const result = initializeReferenceDoc(this.root, spec.path as 'ARCHITECTURE.md' | 'docs/CLI.md' | 'docs/MCP.md' | 'docs/GUIDE.md');
      return {
        ok: true,
        requested: spec.name,
        initializedTargets: result.initialized ? [result.path] : [],
        skippedPaths: result.initialized ? [] : [result.path],
        signpost: this.signpostStatus().signposts.find((entry) => entry.path === spec.path)!,
      };
    }

    const signpostPath = resolve(this.root, spec.path);
    mkdirSync(dirname(signpostPath), { recursive: true });
    writeFileSync(signpostPath, renderBearing(this.status(), this.closedCycles(), await this.currentCommitSha()), 'utf8');
    return {
      ok: true,
      requested: spec.name,
      initializedTargets: [spec.path],
      skippedPaths: [],
      signpost: this.signpostStatus().signposts.find((entry) => entry.path === spec.path)!,
    };
  }

  async shipSync(): Promise<{ updated: string[]; newShips: Cycle[] }> {
    const changelogPath = resolve(this.root, 'CHANGELOG.md');
    const bearingPath = resolve(this.root, 'docs/BEARING.md');
    const status = this.status();
    const closedCycles = this.closedCycles();
    const commitSha = await this.currentCommitSha();

    const newShips = this.findNewShips(closedCycles);
    const updated: string[] = [];

    if (newShips.length > 0) {
      this.updateChangelog(changelogPath, newShips);
      updated.push('CHANGELOG.md');
    }

    writeFileSync(bearingPath, renderBearing(status, closedCycles, commitSha), 'utf8');
    updated.push('docs/BEARING.md');

    const refs = this.syncRefs();
    for (const signpost of refs.updated) {
      if (!updated.includes(signpost)) {
        updated.push(signpost);
      }
    }

    return { updated, newShips };
  }

  private async currentCommitSha(): Promise<string> {
    try {
      const git = GitPlumbing.createDefault({ cwd: this.root });
      return await git.execute({ args: ['rev-parse', 'HEAD'] });
    } catch {
      return 'unknown';
    }
  }

  async captureWitness(cycleName?: string): Promise<string> {
    const cycle = this.resolveCycle(cycleName);
    const retroDir = dirname(cycle.retroDoc);
    const witnessPath = resolve(retroDir, 'witness', 'verification.md');

    mkdirSync(dirname(witnessPath), { recursive: true });

    const testResult = sanitizeWitnessOutput(await this.execCommand('npm', ['test']), this.root);
    const driftResult = sanitizeWitnessOutput(this.detectDrift(cycle.name).output, this.root);

    const content = renderWitnessDoc({
      cycle,
      testResult,
      driftResult,
    });

    writeFileSync(witnessPath, content, 'utf8');
    return witnessPath;
  }

  status(): WorkspaceStatus {
    const backlog = createBacklogBuckets();

    const backlogItems = this.collectBacklogItems();
    for (const item of backlogItems) {
      if (backlog[item.lane] === undefined) {
        backlog[item.lane] = [];
      }
      backlog[item.lane].push(item);
    }

    const activeCycles = this.openCycles();
    const legendHealth = this.calculateLegendHealth(backlogItems, activeCycles);

    return {
      root: this.root,
      backlog: orderBacklogBuckets(backlog),
      activeCycles,
      legendHealth,
    };
  }

  backlogQuery(options: {
    lane?: string;
    legend?: string;
    priority?: string;
    keyword?: string;
    owner?: string;
    ready?: boolean;
    hasAcceptanceCriteria?: boolean;
    blockedBy?: string;
    blocks?: string;
    sort?: string;
    limit?: number;
  } = {}): BacklogQueryResult {
    const laneFilter = normalizeBacklogQueryLane(options.lane);
    const legendFilter = normalizeBacklogQueryLegend(options.legend);
    const priorityFilter = normalizeBacklogPriority(options.priority);
    const keywordFilter = normalizeBacklogKeywordFilter(options.keyword);
    const ownerFilter = normalizeBacklogOwnerFilter(options.owner);
    const readyFilter = options.ready;
    const hasAcceptanceCriteriaFilter = options.hasAcceptanceCriteria;
    const blockedByFilter = normalizeBacklogDependencyFilter(options.blockedBy);
    const blocksFilter = normalizeBacklogDependencyFilter(options.blocks);
    const sortMode = normalizeBacklogQuerySort(options.sort);
    const limit = normalizeBacklogQueryLimit(options.limit);

    const filtered = filterBacklogQueryItems(this.collectBacklogQueryItems(), {
      lane: laneFilter,
      legend: legendFilter,
      priority: priorityFilter,
      keyword: keywordFilter,
      owner: ownerFilter,
      ready: readyFilter,
      hasAcceptanceCriteria: hasAcceptanceCriteriaFilter,
      blockedBy: blockedByFilter,
      blocks: blocksFilter,
    })
      .sort((left, right) => compareBacklogQueryItems(left, right, sortMode));

    const items = filtered.slice(0, limit);
    return {
      root: this.root,
      filters: {
        lane: laneFilter,
        legend: legendFilter,
        priority: priorityFilter,
        keyword: keywordFilter,
        owner: ownerFilter,
        ready: readyFilter,
        hasAcceptanceCriteria: hasAcceptanceCriteriaFilter,
        blockedBy: blockedByFilter,
        blocks: blocksFilter,
        sort: sortMode,
        limit,
      },
      items,
      totalCount: filtered.length,
      returnedCount: items.length,
      truncated: filtered.length > items.length,
    };
  }

  nextWork(options: {
    lane?: string;
    legend?: string;
    priority?: string;
    keyword?: string;
    owner?: string;
    includeBlocked?: boolean;
    limit?: number;
  } = {}): NextWorkResult {
    const limit = normalizeNextWorkLimit(options.limit);
    const status = this.status();
    const laneFilter = normalizeBacklogQueryLane(options.lane);
    const legendFilter = normalizeBacklogQueryLegend(options.legend);
    const priorityFilter = normalizeBacklogPriority(options.priority);
    const keywordFilter = normalizeBacklogKeywordFilter(options.keyword);
    const ownerFilter = normalizeBacklogOwnerFilter(options.owner);
    const includeBlocked = options.includeBlocked ?? false;
    const allItems = filterBacklogQueryItems(this.collectBacklogQueryItems(), {
      lane: laneFilter,
      legend: legendFilter,
      priority: priorityFilter,
      keyword: keywordFilter,
      owner: ownerFilter,
    });
    const readyItems = allItems.filter((item) => item.blockedBy.length === 0);
    const candidateItems = includeBlocked || readyItems.length === 0 ? allItems : readyItems;
    const skippedBlockedCount = includeBlocked ? 0 : allItems.length - readyItems.length;
    const bearing = readBearingSignals(this.root);
    const baselineRanked = candidateItems
      .map((item) => rankNextWorkItem(item, status, { exists: false, priority: undefined, concerns: [], sections: [] }))
      .sort(compareRankedNextWorkItems);
    const ranked = candidateItems
      .map((item) => rankNextWorkItem(item, status, bearing))
      .sort(compareRankedNextWorkItems);
    const top = ranked.slice(0, limit);
    const recommendations = top.map((entry, index, array) => ({
      path: entry.item.path,
      title: entry.item.title ?? titleCase(entry.item.slug),
      lane: entry.item.lane,
      priority: entry.item.priority,
      scoreBand: nextWorkScoreBand(index, array.length),
      whyNow: buildNextWorkWhyNow(entry),
      signals: entry.signals,
    }));
    const selectionNotes: string[] = [];
    if (status.activeCycles.length > 0) {
      selectionNotes.push(`An active cycle is already open (${status.activeCycles.map((cycle) => cycle.name).join(', ')}), so this menu is advisory rather than a pull directive.`);
    }
    if (skippedBlockedCount > 0 && readyItems.length > 0) {
      selectionNotes.push(`Skipped ${skippedBlockedCount} blocked backlog item(s) because unblocked work is available.`);
    }
    if (includeBlocked) {
      selectionNotes.push('Blocked items were included because `include-blocked` was requested.');
    }
    const filterSummary = summarizeNextWorkFilters({
      lane: laneFilter,
      legend: legendFilter,
      priority: priorityFilter,
      keyword: keywordFilter,
      owner: ownerFilter,
    });
    if (filterSummary !== undefined) {
      selectionNotes.push(`Applied filters: ${filterSummary}.`);
    }
    if (!bearing.exists) {
      selectionNotes.push('BEARING was not present, so no directional mention signals were considered.');
    }
    selectionNotes.push(...deriveNextWorkOverrideNotes(baselineRanked, ranked, limit));
    if (recommendations.length === 0) {
      selectionNotes.push('No candidate backlog items were found.');
    }

    return {
      generated_at: new Date().toISOString(),
      summary: {
        active_cycle_count: status.activeCycles.length,
        lane_counts: Object.fromEntries(Object.entries(status.backlog).map(([lane, items]) => [lane, items.length])),
        bearing_priority: bearing.priority,
        bearing_concerns: bearing.concerns,
      },
      recommendations,
      selection_notes: selectionNotes,
    };
  }

  backlogDependencies(options: {
    item?: string;
    readyOnly?: boolean;
    criticalPath?: boolean;
  } = {}): BacklogDependencyReport {
    const allBacklogItems = this.collectBacklogItems();
    const dependencyItems = allBacklogItems.map((item) => {
      const frontmatter = fmReadTypedFrontmatter(resolve(this.root, item.path));
      return {
        ...item,
        title: normalizeOptionalString(frontmatter.title),
        blockedByRefs: normalizeDependencyRefs(frontmatter.blocked_by),
        blocksRefs: normalizeDependencyRefs(frontmatter.blocks),
        blockedBySet: new Set<string>(),
        blocksSet: new Set<string>(),
        unresolvedBlockedBySet: new Set<string>(),
        unresolvedBlocksSet: new Set<string>(),
      };
    });

    const edgeMap = new Map<string, BacklogDependencyEdge>();
    for (const item of dependencyItems) {
      for (const ref of item.blockedByRefs) {
        const blockerPath = resolveDependencyItemRef(ref, dependencyItems);
        if (blockerPath === undefined) {
          item.unresolvedBlockedBySet.add(ref);
          continue;
        }
        const edgeKey = `${blockerPath}=>${item.path}`;
        edgeMap.set(edgeKey, { blocker: blockerPath, blocked: item.path });
      }

      for (const ref of item.blocksRefs) {
        const blockedPath = resolveDependencyItemRef(ref, dependencyItems);
        if (blockedPath === undefined) {
          item.unresolvedBlocksSet.add(ref);
          continue;
        }
        const edgeKey = `${item.path}=>${blockedPath}`;
        edgeMap.set(edgeKey, { blocker: item.path, blocked: blockedPath });
      }
    }

    const itemsByPath = new Map(dependencyItems.map((item) => [item.path, item]));
    for (const edge of edgeMap.values()) {
      itemsByPath.get(edge.blocker)?.blocksSet.add(edge.blocked);
      itemsByPath.get(edge.blocked)?.blockedBySet.add(edge.blocker);
    }

    const finalizedItems = dependencyItems
      .map((item) => finalizeDependencyItem(item))
      .sort(compareBacklogPaths);
    const finalizedByPath = new Map(finalizedItems.map((item) => [item.path, item]));
    const finalizedEdges = [...edgeMap.values()].sort((left, right) =>
      left.blocker.localeCompare(right.blocker) || left.blocked.localeCompare(right.blocked));
    const adjacency = new Map<string, Set<string>>();
    for (const item of finalizedItems) {
      adjacency.set(item.path, new Set(item.blocks));
    }
    const cycles = findDependencyCycles(finalizedItems.map((item) => item.path), adjacency);
    const ready = finalizedItems.filter((item) => item.ready);
    const report: BacklogDependencyReport = {
      root: this.root,
      query: {
        item: options.item,
        readyOnly: options.readyOnly ?? false,
        criticalPath: options.criticalPath ?? false,
      },
      items: finalizedItems,
      edges: finalizedEdges,
      ready,
      cycles,
    };

    if (options.item !== undefined) {
      const focusPath = this.resolveBacklogPath(options.item);
      const focusItem = finalizedByPath.get(focusPath);
      if (focusItem === undefined) {
        throw new MethodError(`Could not find backlog item ${JSON.stringify(options.item)}.`);
      }

      const blockers = focusItem.blockedBy
        .map((path) => finalizedByPath.get(path))
        .filter((item): item is BacklogDependencyItem => item !== undefined)
        .sort(compareBacklogPaths);
      const blocked = focusItem.blocks
        .map((path) => finalizedByPath.get(path))
        .filter((item): item is BacklogDependencyItem => item !== undefined)
        .sort(compareBacklogPaths);

      let criticalPath: BacklogDependencyItem[] = [];
      let criticalPathReason: string | undefined;
      if (options.criticalPath) {
        if (cycles.length > 0) {
          criticalPathReason = 'Critical path is unavailable while dependency cycles exist.';
        } else {
          criticalPath = longestDependencyPathTo(focusItem.path, finalizedByPath)
            .map((path) => finalizedByPath.get(path))
            .filter((item): item is BacklogDependencyItem => item !== undefined);
        }
      }

      report.focus = {
        item: focusItem,
        blockers,
        blocked,
        criticalPath,
        criticalPathReason,
      };
    }

    return report;
  }

  updateFrontmatter(path: string, updates: Record<string, string>): void {
    fmUpdateFrontmatter(resolve(this.root, path), updates);
  }

  readFrontmatter(path: string): Record<string, string> {
    return fmReadFrontmatter(resolve(this.root, path));
  }

  resolveRepoPath(path: string): string {
    return relative(this.root, path);
  }

  resolveBacklogPath(item: string): string {
    return relative(this.root, this.resolveBacklogItem(item));
  }

  describeBacklogPath(path: string) {
    const fullPath = resolve(this.root, path);
    assertWorkspacePath(this.root, fullPath, 'Backlog path');
    if (!existsSync(fullPath)) {
      throw new MethodError(`Backlog item not found: ${path}`);
    }

    const frontmatter = fmReadFrontmatter(fullPath);
    const stem = fileStem(fullPath);
    const filenameMetadata = splitLegend(stem);
    const hasExplicitLegend = Object.prototype.hasOwnProperty.call(frontmatter, 'legend');

    return {
      stem,
      lane: normalizeBacklogLane(frontmatter.lane) ?? inferBacklogLane(this.paths.backlog, fullPath),
      path: relative(this.root, fullPath),
      legend: hasExplicitLegend
        ? normalizeLegend(frontmatter.legend) ?? filenameMetadata.legend
        : filenameMetadata.legend,
      slug: filenameMetadata.slug,
      title: frontmatter.title,
      release: normalizeOptionalString(frontmatter.release),
      source: frontmatter.source,
      captured_at: frontmatter.captured_at,
    };
  }

  updateBody(path: string, newBody: string): void {
    fmUpdateBody(resolve(this.root, path), newBody);
  }

  moveBacklogItem(path: string, targetLane: BacklogLane | 'graveyard'): string {
    const fullPath = resolve(this.root, path);
    assertWorkspacePath(this.root, fullPath, 'Backlog path');
    if (!existsSync(fullPath)) {
      throw new MethodError(`Backlog item not found: ${path}`);
    }

    const metadata = this.readBacklogItem(fullPath, inferBacklogLane(this.paths.backlog, fullPath));
    const fileName = basename(fullPath);
    const normalizedTargetLane = targetLane === 'graveyard'
      ? targetLane
      : normalizeBacklogLane(targetLane);
    if (normalizedTargetLane === undefined) {
      throw new MethodError(`Invalid backlog lane: ${targetLane}`);
    }
    let targetDir: string;
    if (normalizedTargetLane === 'graveyard') {
      targetDir = this.paths.graveyard;
    } else if (normalizedTargetLane === 'root') {
      targetDir = this.paths.backlog;
    } else {
      targetDir = resolve(this.paths.backlog, normalizedTargetLane);
    }
    
    mkdirSync(targetDir, { recursive: true });
    const targetPath = resolve(targetDir, fileName);

    if (fullPath !== targetPath && existsSync(targetPath)) {
      throw new MethodError(`Destination already exists: ${relative(this.root, targetPath)}`);
    }

    if (fullPath !== targetPath) {
      renameSync(fullPath, targetPath);
    }
    const frontmatterUpdates: Record<string, string> = { lane: normalizedTargetLane };
    if (metadata.legend !== undefined) {
      frontmatterUpdates.legend = metadata.legend;
    }
    if (normalizedTargetLane !== 'root' && normalizedTargetLane !== 'graveyard' && isReleaseLane(normalizedTargetLane)) {
      frontmatterUpdates.release = normalizedTargetLane;
    }
    fmUpdateFrontmatter(targetPath, frontmatterUpdates);
    return relative(this.root, targetPath);
  }

  retireBacklogItem(item: string, reason: string, replacement?: string, options?: { dryRun?: boolean }) {
    const cleanReason = reason.trim();
    if (cleanReason.length === 0) {
      throw new MethodError('Reason cannot be empty.');
    }

    const cleanReplacement = replacement?.trim().length ? replacement.trim() : undefined;
    const fullPath = this.resolveBacklogItem(item);
    const sourcePath = relative(this.root, fullPath);
    const graveyardPath = relative(this.root, resolve(this.paths.graveyard, basename(fullPath)));
    if (sourcePath === graveyardPath) {
      throw new MethodError(`Backlog item is already retired: ${graveyardPath}`);
    }
    if (existsSync(resolve(this.root, graveyardPath))) {
      throw new MethodError(`Destination already exists: ${graveyardPath}`);
    }

    const result = {
      ok: true,
      dryRun: options?.dryRun ?? false,
      sourcePath,
      graveyardPath,
      reason: cleanReason,
      replacement: cleanReplacement,
      updatedFiles: [sourcePath, graveyardPath],
    };
    if (options?.dryRun) {
      return result;
    }

    const originalProposal = readBody(fullPath);
    const movedPath = this.moveBacklogItem(sourcePath, 'graveyard');
    this.updateBody(movedPath, renderRetiredBody(cleanReason, originalProposal, cleanReplacement));
    return { ...result, graveyardPath: movedPath, updatedFiles: [sourcePath, movedPath] };
  }

  editBacklogMetadata(item: string, updates: {
    owner?: string;
    clearOwner?: boolean;
    priority?: string;
    clearPriority?: boolean;
    keywords?: readonly string[];
    clearKeywords?: boolean;
    blockedBy?: readonly string[];
    clearBlockedBy?: boolean;
    blocks?: readonly string[];
    clearBlocks?: boolean;
  }): BacklogMetadataEditResult {
    const fullPath = this.resolveBacklogItem(item);
    const typedUpdates: Record<string, unknown> = {};
    const updatedFields: string[] = [];

    applyMetadataEditField({
      setValue: updates.owner,
      clearValue: updates.clearOwner ?? false,
      field: 'owner',
      normalize: (value) => normalizeRequiredMetadataString(value, 'owner'),
      target: typedUpdates,
      updatedFields,
    });
    applyMetadataEditField({
      setValue: updates.priority,
      clearValue: updates.clearPriority ?? false,
      field: 'priority',
      normalize: (value) => normalizeRequiredBacklogPriority(value),
      target: typedUpdates,
      updatedFields,
    });
    applyMetadataEditField({
      setValue: updates.keywords,
      clearValue: updates.clearKeywords ?? false,
      field: 'keywords',
      normalize: (value) => normalizeRequiredMetadataList(value, 'keywords'),
      target: typedUpdates,
      updatedFields,
    });
    applyMetadataEditField({
      setValue: updates.blockedBy,
      clearValue: updates.clearBlockedBy ?? false,
      field: 'blocked_by',
      normalize: (value) => normalizeRequiredMetadataList(value, 'blocked_by'),
      target: typedUpdates,
      updatedFields,
    });
    applyMetadataEditField({
      setValue: updates.blocks,
      clearValue: updates.clearBlocks ?? false,
      field: 'blocks',
      normalize: (value) => normalizeRequiredMetadataList(value, 'blocks'),
      target: typedUpdates,
      updatedFields,
    });

    if (updatedFields.length === 0) {
      throw new MethodError('No backlog metadata updates were requested.');
    }

    fmUpdateTypedFrontmatter(fullPath, typedUpdates);
    return {
      ...this.readBacklogQueryItem(fullPath, inferBacklogLane(this.paths.backlog, fullPath)),
      updatedFields,
    };
  }

  openCycles(): Cycle[] {
    return this.allCycles().filter((cycle) => existsSync(cycle.designDoc) && !existsSync(cycle.retroDoc));
  }

  closedCycles(): Cycle[] {
    return this.allCycles().filter((cycle) => existsSync(cycle.retroDoc));
  }

  private findNewShips(closedCycles: Cycle[]): Cycle[] {
    const changelogPath = resolve(this.root, 'CHANGELOG.md');
    if (!existsSync(changelogPath)) {
      return closedCycles;
    }
    const content = readFileSync(changelogPath, 'utf8');
    return closedCycles.filter((cycle) => (
      !content.includes(`- ${cycle.name}:`)
      && !content.includes(`(${cycle.name})`)
    ));
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
      assertWorkspacePath(this.root, direct, 'Backlog path');
      if (isLiveBacklogFile(this.paths.backlog, direct)) {
        return direct;
      }
      throw new MethodError(`Backlog item must be a live backlog doc under ${relative(this.root, this.paths.backlog)}.`);
    }

    const backlogFiles = collectMarkdownFiles(this.paths.backlog);
    const exactMatches = backlogFiles.filter((file) => {
      const stem = fileStem(file);
      const { slug } = splitLegend(stem);
      return file === direct || basename(file) === item || stem === item || slug === item;
    });
    if (exactMatches.length === 1) {
      return exactMatches[0];
    }
    if (exactMatches.length > 1) {
      throw new MethodError(`Ambiguous backlog item ${JSON.stringify(item)}: ${exactMatches.map((file) => relative(this.root, file)).join(', ')}`);
    }

    const lowerItem = item.toLowerCase();
    const fuzzyMatches = backlogFiles.filter((file) => {
      const stem = fileStem(file).toLowerCase();
      const slug = splitLegend(fileStem(file)).slug.toLowerCase();
      return stem === lowerItem || slug === lowerItem;
    });
    if (fuzzyMatches.length === 1) {
      return fuzzyMatches[0];
    }
    throw new MethodError(`Could not find backlog item ${JSON.stringify(item)}.`);
  }

  private allCycles(): Cycle[] {
    const cycles = new Map<string, Cycle>();
    for (const base of [this.paths.design, this.paths.retro, resolve(this.root, 'docs/releases')]) {
      if (!existsSync(base)) {
        continue;
      }
      for (const file of collectMarkdownFiles(base)) {
        const cycle = readCycleFromDoc(this.root, this.paths, file);
        if (cycle === undefined) {
          continue;
        }
        const existing = cycles.get(cycle.name);
        if (existing === undefined) {
          cycles.set(cycle.name, cycle);
          continue;
        }
        cycles.set(cycle.name, {
          ...existing,
          designDoc: existsSync(cycle.designDoc) ? cycle.designDoc : existing.designDoc,
          retroDoc: existsSync(cycle.retroDoc) ? cycle.retroDoc : existing.retroDoc,
        });
      }
    }
    return [...cycles.values()].sort((left, right) => left.name.localeCompare(right.name));
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

  private collectBacklogItems(): BacklogItem[] {
    if (!existsSync(this.paths.backlog)) {
      return [];
    }

    return collectMarkdownFiles(this.paths.backlog).map((file) =>
      this.readBacklogItem(file, inferBacklogLane(this.paths.backlog, file)));
  }

  private collectBacklogQueryItems(): BacklogQueryItem[] {
    return this.collectBacklogItems().map((item) =>
      this.readBacklogQueryItem(resolve(this.root, item.path), item.lane));
  }

  private readBacklogQueryItem(path: string, fallbackLane: BacklogLane): BacklogQueryItem {
    const base = this.readBacklogItem(path, fallbackLane);
    const frontmatter = fmReadTypedFrontmatter(path);
    return {
      ...base,
      title: normalizeOptionalString(frontmatter.title),
      owner: normalizeOptionalString(frontmatter.owner),
      priority: normalizeBacklogPriority(frontmatter.priority),
      keywords: normalizeBacklogKeywords(frontmatter.keywords),
      blockedBy: normalizeDependencyRefs(frontmatter.blocked_by),
      blocks: normalizeDependencyRefs(frontmatter.blocks),
      hasAcceptanceCriteria: Object.prototype.hasOwnProperty.call(frontmatter, 'acceptance_criteria'),
    };
  }

  private readBacklogItem(path: string, fallbackLane: BacklogLane): BacklogItem {
    const stem = fileStem(path);
    const filenameMetadata = splitLegend(stem);
    const frontmatter = fmReadFrontmatter(path);
    const hasExplicitLegend = Object.prototype.hasOwnProperty.call(frontmatter, 'legend');

    return {
      stem,
      lane: normalizeBacklogLane(frontmatter.lane) ?? fallbackLane,
      path: relative(this.root, path),
      legend: hasExplicitLegend
        ? normalizeLegend(frontmatter.legend)
        : filenameMetadata.legend,
      slug: filenameMetadata.slug,
    };
  }

  private calculateLegendHealth(backlogItems: readonly BacklogItem[], activeCycles: readonly Cycle[]): LegendHealth[] {
    const counts = new Map<string, { backlog: number; active: number }>();
    for (const item of backlogItems) {
      const key = item.legend ?? 'untagged';
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

  async execCommand(command: string, args: string[] = [], options?: { timeoutMs?: number }): Promise<string> {
    const fullCommand = [command, ...args].join(' ');
    if (process.env.METHOD_TEST === 'true') {
      return `[MOCK] Output for ${fullCommand}`;
    }
    const execFileAsync = promisify(execFile);
    try {
      const { stdout, stderr } = await execFileAsync(command, args, {
        cwd: this.root,
        encoding: 'utf8',
        timeout: options?.timeoutMs,
      });
      return stdout + stderr;
    } catch (error: any) {
      if (error.killed || error.signal === 'SIGTERM') {
        throw new MethodError(`Command timed out: ${fullCommand}`);
      }
      return (error.stdout ?? '') + (error.stderr ?? '');
    }
  }
}

// collectMarkdownFiles, assertWorkspacePath imported from ./workspace-utils.js

function splitLegend(stem: string): { legend?: string; slug: string } {
  const match = LEGEND_PATTERN.exec(stem);
  if (match?.groups === undefined) {
    return { slug: stem };
  }
  return { legend: match.groups.legend, slug: match.groups.slug };
}

export const readHeading = fmReadHeading;

export const readBody = fmReadBody;

function readDesignLegend(path: string): string | undefined {
  const frontmatter = fmReadFrontmatter(path);
  if (Object.prototype.hasOwnProperty.call(frontmatter, 'legend')) {
    return normalizeLegend(frontmatter.legend);
  }

  for (const line of readFileSync(path, 'utf8').split(/\r?\n/u)) {
    if (!line.startsWith('Legend: ')) {
      continue;
    }
    const value = line.slice('Legend: '.length).trim();
    return normalizeLegend(value);
  }
  return undefined;
}

function readBearingSignals(root: string): BearingSignals {
  const bearingPath = resolve(root, 'docs/BEARING.md');
  if (!existsSync(bearingPath)) {
    return { exists: false, priority: undefined, concerns: [], sections: [] };
  }

  const content = readFileSync(bearingPath, 'utf8');
  const prioritySection = extractMarkdownSection(content, 'Where are we going?');
  const concernsSection = extractMarkdownSection(content, 'What feels wrong?');
  return {
    exists: true,
    priority: collapseWhitespace(prioritySection),
    concerns: extractBearingConcerns(concernsSection),
    sections: [
      { name: 'Where are we going?', text: prioritySection, lines: splitNonEmptyLines(prioritySection) },
      { name: 'What feels wrong?', text: concernsSection, lines: splitNonEmptyLines(concernsSection) },
    ],
  };
}

function extractMarkdownSection(content: string, heading: string): string {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  const match = new RegExp(`^## ${escapedHeading}\\n\\n([\\s\\S]*?)(?=\\n## |$)`, 'mu').exec(content);
  return (match?.[1] ?? '').trim();
}

function splitNonEmptyLines(content: string): string[] {
  return content
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function collapseWhitespace(content: string): string | undefined {
  const normalized = content.replace(/\s+/gu, ' ').trim();
  return normalized.length === 0 ? undefined : normalized;
}

function extractBearingConcerns(content: string): string[] {
  const bulletLines = splitNonEmptyLines(content)
    .filter((line) => line.startsWith('- '))
    .map((line) => line.slice(2).trim())
    .filter((line) => line.length > 0);
  if (bulletLines.length > 0) {
    return bulletLines;
  }
  const collapsed = collapseWhitespace(content);
  return collapsed === undefined ? [] : [collapsed];
}

function rankNextWorkItem(
  item: BacklogQueryItem,
  status: WorkspaceStatus,
  bearing: BearingSignals,
): RankedNextWorkItem {
  const laneRank = nextWorkLaneRank(item.lane);
  let score = 1000 - (laneRank * 100);
  const signals: NextWorkSignal[] = [
    { type: 'lane', value: item.lane, source: 'frontmatter.lane' },
  ];
  const whyNow: string[] = [
    `Lane \`${item.lane}\` is near the front of the current queue.`,
  ];

  if (item.priority !== undefined) {
    score += nextWorkPriorityScore(item.priority);
    signals.push({ type: 'priority', value: item.priority, source: 'frontmatter.priority' });
    whyNow.push(`Priority is declared as \`${item.priority}\`.`);
  }

  if (item.hasAcceptanceCriteria) {
    score += 10;
    signals.push({ type: 'acceptance_criteria', value: true, source: 'frontmatter.acceptance_criteria' });
    whyNow.push('Acceptance criteria are already declared.');
  }

  if (item.owner !== undefined) {
    signals.push({ type: 'owner', value: item.owner, source: 'frontmatter.owner' });
  }

  if (item.blockedBy.length === 0) {
    score += 20;
    signals.push({ type: 'dependency_ready', value: true, source: 'frontmatter.blocked_by' });
    whyNow.push('No blocking dependencies are declared.');
  } else {
    score -= 60;
    signals.push({ type: 'blocked_by_count', value: item.blockedBy.length, source: 'frontmatter.blocked_by' });
    whyNow.push(`${item.blockedBy.length} blocking dependenc${item.blockedBy.length === 1 ? 'y is' : 'ies are'} declared.`);
  }

  if (status.activeCycles.length > 0) {
    signals.push({ type: 'active_cycle_count', value: status.activeCycles.length, source: 'status.activeCycles' });
  }

  for (const section of bearing.sections) {
    const matchingLine = section.lines.find((line) => line.includes(item.stem));
    if (matchingLine === undefined) {
      continue;
    }
    const bonus = section.name === 'Where are we going?' ? 250 : 180;
    score += bonus;
    signals.push({
      type: 'bearing_mention',
      value: matchingLine,
      source: `docs/BEARING.md#${section.name}`,
    });
    whyNow.push(`BEARING mentions \`${item.stem}\` under "${section.name}".`);
  }

  return {
    item,
    score,
    laneRank,
    signals,
    whyNow,
    bearingOverride: signals.some((signal) => signal.type === 'bearing_mention'),
  };
}

function nextWorkLaneRank(lane: BacklogQueryItem['lane']): number {
  if (lane === 'asap') return 0;
  if (lane === 'up-next') return 1;
  if (isReleaseLane(lane)) return 1;
  if (lane === 'bad-code') return 3;
  if (lane === 'inbox') return 4;
  if (lane === 'cool-ideas') return 5;
  if (lane === 'root') return 7;
  return 6;
}

function nextWorkPriorityScore(priority: string): number {
  if (priority === 'critical') return 40;
  if (priority === 'high') return 30;
  if (priority === 'medium') return 20;
  if (priority === 'low') return 10;
  return 5;
}

function compareRankedNextWorkItems(left: RankedNextWorkItem, right: RankedNextWorkItem): number {
  return right.score - left.score
    || left.laneRank - right.laneRank
    || compareBacklogPaths(left.item, right.item);
}

function buildNextWorkWhyNow(entry: RankedNextWorkItem): string[] {
  return [...new Set(entry.whyNow)].slice(0, 4);
}

function nextWorkScoreBand(index: number, total: number): NextWorkScoreBand {
  const highestCount = Math.min(total, 2);
  const strongCount = Math.min(Math.max(total - highestCount, 0), 3);
  if (index < highestCount) {
    return 'highest';
  }
  if (index < highestCount + strongCount) {
    return 'strong';
  }
  return 'worth-considering';
}

function normalizeNextWorkLimit(value: number | undefined): number {
  const limit = value ?? 3;
  if (!Number.isInteger(limit) || limit <= 0 || limit > 10) {
    throw new MethodError('Next-work limit must be an integer between 1 and 10.');
  }
  return limit;
}

function deriveNextWorkOverrideNotes(
  baseline: RankedNextWorkItem[],
  ranked: RankedNextWorkItem[],
  limit: number,
): string[] {
  const baselinePositions = new Map(baseline.map((entry, index) => [entry.item.path, index]));
  const finalPositions = new Map(ranked.map((entry, index) => [entry.item.path, index]));
  const notes: string[] = [];

  for (const entry of ranked.slice(0, Math.min(limit, 3))) {
    if (!entry.bearingOverride) {
      continue;
    }
    const baselinePosition = baselinePositions.get(entry.item.path);
    const finalPosition = finalPositions.get(entry.item.path);
    if (baselinePosition === undefined || finalPosition === undefined || finalPosition >= baselinePosition) {
      continue;
    }

    const movedIntoTopThree = baselinePosition >= 3 && finalPosition < 3;
    const jumpedLaneOrder = baseline.some((other) =>
      nextWorkLaneRank(other.item.lane) < nextWorkLaneRank(entry.item.lane)
      && (baselinePositions.get(other.item.path) ?? Number.POSITIVE_INFINITY) < baselinePosition
      && (finalPositions.get(other.item.path) ?? Number.POSITIVE_INFINITY) > finalPosition,
    );
    if (!movedIntoTopThree && !jumpedLaneOrder) {
      continue;
    }

    const sections = entry.signals
      .filter((signal) => signal.type === 'bearing_mention')
      .map((signal) => signal.source.replace('docs/BEARING.md#', ''))
      .join(', ');
    notes.push(`BEARING elevated \`${entry.item.stem}\` via ${sections} above the default lane ordering.`);
  }

  return notes;
}

// normalizeOptionalString imported from ./workspace-utils.js

function normalizeRequiredMetadataString(value: string | undefined, field: string): string {
  const normalized = normalizeOptionalString(value);
  if (normalized === undefined) {
    throw new MethodError(`${field} cannot be empty.`);
  }
  return normalized;
}

function normalizeBacklogPriority(value: unknown): string | undefined {
  const normalized = normalizeOptionalString(value);
  return normalized?.toLowerCase();
}

function normalizeRequiredBacklogPriority(value: string | undefined): string {
  const normalized = normalizeBacklogPriority(value);
  if (normalized === undefined) {
    throw new MethodError('priority cannot be empty.');
  }
  return normalized;
}

function normalizeBacklogKeywords(value: unknown): string[] {
  const seen = new Set<string>();
  const keywords = normalizeDependencyRefs(value)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .filter((entry) => {
      const key = entry.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  return keywords;
}

function normalizeRequiredMetadataList(value: readonly string[] | undefined, field: string): string[] {
  if (value === undefined) {
    throw new MethodError(`${field} requires at least one value.`);
  }
  const normalized = normalizeBacklogKeywords(value);
  if (normalized.length === 0) {
    throw new MethodError(`${field} requires at least one non-empty value.`);
  }
  return normalized;
}

function applyMetadataEditField<T>(options: {
  setValue: T | undefined;
  clearValue: boolean;
  field: string;
  normalize: (value: T) => unknown;
  target: Record<string, unknown>;
  updatedFields: string[];
}): void {
  if (options.setValue !== undefined && options.clearValue) {
    throw new MethodError(`Cannot both set and clear ${options.field}.`);
  }
  if (options.setValue === undefined && !options.clearValue) {
    return;
  }

  options.target[options.field] = options.clearValue
    ? undefined
    : options.normalize(options.setValue as T);
  options.updatedFields.push(options.field);
}

function normalizeDependencyRefs(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((entry) => String(entry).trim())
      .filter((entry) => entry.length > 0);
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    const normalized = String(value).trim();
    return normalized.length === 0 ? [] : [normalized];
  }
  return [];
}

function resolveDependencyItemRef(
  ref: string,
  items: ReadonlyArray<{ path: string; stem: string; slug: string }>,
): string | undefined {
  const normalized = ref.trim();
  if (normalized.length === 0) {
    return undefined;
  }

  const exactMatches = items.filter((item) =>
    item.path === normalized
    || basename(item.path) === normalized
    || item.stem === normalized
    || item.slug === normalized);
  if (exactMatches.length === 1) {
    return exactMatches[0].path;
  }
  if (exactMatches.length > 1) {
    return undefined;
  }

  const lower = normalized.toLowerCase();
  const fuzzyMatches = items.filter((item) =>
    item.path.toLowerCase() === lower
    || basename(item.path).toLowerCase() === lower
    || item.stem.toLowerCase() === lower
    || item.slug.toLowerCase() === lower);
  return fuzzyMatches.length === 1 ? fuzzyMatches[0].path : undefined;
}

function finalizeDependencyItem(item: {
  stem: string;
  lane: BacklogLane;
  path: string;
  legend?: string;
  slug: string;
  title?: string;
  blockedBySet: Set<string>;
  blocksSet: Set<string>;
  unresolvedBlockedBySet: Set<string>;
  unresolvedBlocksSet: Set<string>;
}): BacklogDependencyItem {
  const blockedBy = [...item.blockedBySet].sort();
  const blocks = [...item.blocksSet].sort();
  const unresolvedBlockedBy = [...item.unresolvedBlockedBySet].sort();
  const unresolvedBlocks = [...item.unresolvedBlocksSet].sort();
  return {
    stem: item.stem,
    lane: item.lane,
    path: item.path,
    legend: item.legend,
    slug: item.slug,
    title: item.title,
    blockedBy,
    blocks,
    unresolvedBlockedBy,
    unresolvedBlocks,
    ready: blockedBy.length === 0 && unresolvedBlockedBy.length === 0,
  };
}

function compareBacklogPaths(
  left: { path: string },
  right: { path: string },
): number {
  return left.path.localeCompare(right.path);
}

function compareBacklogQueryItems(
  left: BacklogQueryItem,
  right: BacklogQueryItem,
  sort: BacklogQuerySort,
): number {
  if (sort === 'path') {
    return compareBacklogPaths(left, right);
  }
  if (sort === 'priority') {
    const priorityRank = compareBacklogQueryPriority(left.priority, right.priority);
    if (priorityRank !== 0) {
      return priorityRank;
    }
  }
  const laneOrder = orderedBacklogLaneNames([left.lane, right.lane]);
  const leftRank = laneOrder.indexOf(left.lane);
  const rightRank = laneOrder.indexOf(right.lane);
  if (leftRank !== rightRank) {
    return leftRank - rightRank;
  }
  return compareBacklogPaths(left, right);
}

function compareBacklogQueryPriority(
  left: string | undefined,
  right: string | undefined,
): number {
  return backlogQueryPriorityRank(right) - backlogQueryPriorityRank(left);
}

function backlogQueryPriorityRank(priority: string | undefined): number {
  if (priority === 'critical') return 4;
  if (priority === 'high') return 3;
  if (priority === 'medium') return 2;
  if (priority === 'low') return 1;
  return 0;
}

function filterBacklogQueryItems(
  items: readonly BacklogQueryItem[],
  filters: {
    lane?: BacklogLane;
    legend?: string;
    priority?: string;
    keyword?: string;
    owner?: string;
    ready?: boolean;
    hasAcceptanceCriteria?: boolean;
    blockedBy?: string;
    blocks?: string;
  },
): BacklogQueryItem[] {
  return items.filter((item) => {
    if (filters.lane !== undefined && item.lane !== filters.lane) {
      return false;
    }
    if (filters.legend !== undefined && item.legend !== filters.legend) {
      return false;
    }
    if (filters.priority !== undefined && item.priority !== filters.priority) {
      return false;
    }
    if (filters.keyword !== undefined && !item.keywords.some((keyword) => keyword.toLowerCase() === filters.keyword)) {
      return false;
    }
    if (filters.owner !== undefined && item.owner?.toLowerCase() !== filters.owner) {
      return false;
    }
    if (filters.ready !== undefined && (item.blockedBy.length === 0) !== filters.ready) {
      return false;
    }
    if (filters.hasAcceptanceCriteria !== undefined && item.hasAcceptanceCriteria !== filters.hasAcceptanceCriteria) {
      return false;
    }
    if (filters.blockedBy !== undefined && !item.blockedBy.some((ref) => ref.toLowerCase() === filters.blockedBy)) {
      return false;
    }
    if (filters.blocks !== undefined && !item.blocks.some((ref) => ref.toLowerCase() === filters.blocks)) {
      return false;
    }
    return true;
  });
}

function summarizeNextWorkFilters(filters: {
  lane?: BacklogLane;
  legend?: string;
  priority?: string;
  keyword?: string;
  owner?: string;
}): string | undefined {
  const parts = [
    filters.lane === undefined ? undefined : `lane=${filters.lane}`,
    filters.legend === undefined ? undefined : `legend=${filters.legend}`,
    filters.priority === undefined ? undefined : `priority=${filters.priority}`,
    filters.keyword === undefined ? undefined : `keyword=${filters.keyword}`,
    filters.owner === undefined ? undefined : `owner=${filters.owner}`,
  ].filter((value): value is string => value !== undefined);
  return parts.length === 0 ? undefined : parts.join(', ');
}

function normalizeBacklogQueryLane(value: string | undefined): BacklogLane | undefined {
  if (value === undefined) {
    return undefined;
  }
  const normalized = normalizeBacklogLane(value);
  if (normalized === undefined) {
    throw new MethodError(`Invalid backlog lane filter: ${value}`);
  }
  return normalized;
}

function normalizeBacklogQueryLegend(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  const normalized = value.trim().toUpperCase();
  if (normalized.length === 0 || !LEGEND_CODE_PATTERN.test(normalized)) {
    throw new MethodError(`Invalid legend filter: ${value}`);
  }
  return normalized;
}

function normalizeBacklogKeywordFilter(value: string | undefined): string | undefined {
  const normalized = normalizeOptionalString(value);
  return normalized?.toLowerCase();
}

function normalizeBacklogOwnerFilter(value: string | undefined): string | undefined {
  const normalized = normalizeOptionalString(value);
  return normalized?.toLowerCase();
}

function normalizeBacklogDependencyFilter(value: string | undefined): string | undefined {
  const normalized = normalizeOptionalString(value);
  return normalized?.toLowerCase();
}

function normalizeBacklogQuerySort(value: string | undefined): BacklogQuerySort {
  const normalized = normalizeOptionalString(value);
  if (normalized === undefined) {
    return 'lane';
  }
  if (normalized === 'lane' || normalized === 'priority' || normalized === 'path') {
    return normalized;
  }
  throw new MethodError(`Invalid backlog query sort: ${value}`);
}

function normalizeBacklogQueryLimit(value: number | undefined): number {
  const limit = value ?? 50;
  if (!Number.isInteger(limit) || limit <= 0 || limit > 100) {
    throw new MethodError('Backlog query limit must be an integer between 1 and 100.');
  }
  return limit;
}

function findDependencyCycles(
  nodes: readonly string[],
  adjacency: ReadonlyMap<string, ReadonlySet<string>>,
): string[][] {
  let index = 0;
  const indexByNode = new Map<string, number>();
  const lowlinkByNode = new Map<string, number>();
  const stack: string[] = [];
  const onStack = new Set<string>();
  const components: string[][] = [];

  const strongConnect = (node: string) => {
    indexByNode.set(node, index);
    lowlinkByNode.set(node, index);
    index += 1;
    stack.push(node);
    onStack.add(node);

    for (const next of adjacency.get(node) ?? []) {
      if (!indexByNode.has(next)) {
        strongConnect(next);
        lowlinkByNode.set(node, Math.min(lowlinkByNode.get(node)!, lowlinkByNode.get(next)!));
      } else if (onStack.has(next)) {
        lowlinkByNode.set(node, Math.min(lowlinkByNode.get(node)!, indexByNode.get(next)!));
      }
    }

    if (lowlinkByNode.get(node) !== indexByNode.get(node)) {
      return;
    }

    const component: string[] = [];
    while (stack.length > 0) {
      const current = stack.pop()!;
      onStack.delete(current);
      component.push(current);
      if (current === node) {
        break;
      }
    }

    const hasSelfLoop = component.length === 1 && (adjacency.get(component[0])?.has(component[0]) ?? false);
    if (component.length > 1 || hasSelfLoop) {
      components.push(component.sort());
    }
  };

  for (const node of nodes) {
    if (!indexByNode.has(node)) {
      strongConnect(node);
    }
  }

  return components.sort((left, right) => left[0]!.localeCompare(right[0]!));
}

function longestDependencyPathTo(
  targetPath: string,
  itemsByPath: ReadonlyMap<string, BacklogDependencyItem>,
): string[] {
  const memo = new Map<string, string[]>();

  const visit = (path: string): string[] => {
    const existing = memo.get(path);
    if (existing !== undefined) {
      return existing;
    }

    const current = itemsByPath.get(path);
    if (current === undefined || current.blockedBy.length === 0) {
      const basePath = [path];
      memo.set(path, basePath);
      return basePath;
    }

    let best = [path];
    for (const blocker of current.blockedBy) {
      const candidate = [...visit(blocker), path];
      if (
        candidate.length > best.length
        || (candidate.length === best.length && candidate.join('>').localeCompare(best.join('>')) < 0)
      ) {
        best = candidate;
      }
    }

    memo.set(path, best);
    return best;
  };

  return visit(targetPath);
}

function readBacklogPullContext(
  path: string,
  fallbackLane: BacklogLane,
): { legend?: string; slug: string; release?: string } {
  const stem = fileStem(path);
  const filenameMetadata = splitLegend(stem);
  const frontmatter = fmReadFrontmatter(path);
  const hasExplicitLegend = Object.prototype.hasOwnProperty.call(frontmatter, 'legend');
  const lane = normalizeBacklogLane(frontmatter.lane) ?? fallbackLane;
  return {
    legend: hasExplicitLegend ? normalizeLegend(frontmatter.legend) : filenameMetadata.legend,
    slug: filenameMetadata.slug,
    release: inferBacklogRelease(lane, frontmatter.release),
  };
}

function inferBacklogRelease(
  lane: string,
  explicitRelease: unknown,
): string | undefined {
  const normalized = normalizeOptionalString(explicitRelease);
  if (normalized !== undefined) {
    if (!isReleaseLane(normalized)) {
      throw new MethodError(`Invalid release tag: ${normalized}`);
    }
    return normalized;
  }
  return isReleaseLane(lane) ? lane : undefined;
}

// resolveCyclePacketPaths imported from ./cycle-ops.js

// readCycleFromDoc, readCycleRelease, and path helpers imported from ./cycle-ops.js

// normalizeRepoPath, slugify, fileStem imported from ./workspace-utils.js

function createBacklogBuckets(): WorkspaceStatus['backlog'] {
  return Object.fromEntries(
    [...LANES, 'root'].map((lane) => [lane, [] as BacklogItem[]]),
  ) as WorkspaceStatus['backlog'];
}

function orderBacklogBuckets(backlog: WorkspaceStatus['backlog']): WorkspaceStatus['backlog'] {
  return Object.fromEntries(
    orderedBacklogLaneNames(Object.keys(backlog)).map((lane) => [lane, backlog[lane] ?? []]),
  );
}

function inferBacklogLane(backlogRoot: string, path: string): BacklogLane {
  const segments = relative(backlogRoot, path)
    .split(/[\\/]/u)
    .filter((segment) => segment.length > 0);
  if (segments.length < 2) {
    return 'root';
  }

  const inferredLane = normalizeBacklogLane(segments[0]);
  return inferredLane === undefined || inferredLane === 'root'
    ? 'root'
    : inferredLane;
}

function normalizeBacklogLane(value: string | undefined): BacklogLane | undefined {
  const normalized = value?.trim();
  if (normalized === undefined || normalized.length === 0) {
    return undefined;
  }
  if (normalized === 'root') {
    return normalized;
  }
  if (isLaneName(normalized)) {
    return normalized as Lane;
  }
  return undefined;
}

function normalizeLiveBacklogLane(value: string | undefined): Lane | undefined {
  const normalized = normalizeBacklogLane(value);
  if (normalized === undefined || normalized === 'root') {
    return undefined;
  }
  return normalized as Lane;
}

function normalizeRequestedLegend(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  const normalized = value.trim().toUpperCase();
  if (!LEGEND_CODE_PATTERN.test(normalized)) {
    throw new MethodError('Legend codes must be uppercase letters and numbers.');
  }
  return normalized;
}

function normalizeCapturedAt(value: string | undefined): string {
  const normalized = value?.trim() ?? new Date().toISOString().slice(0, 10);
  if (!FEEDBACK_DATE_PATTERN.test(normalized)) {
    throw new MethodError('captured_at must use YYYY-MM-DD.');
  }
  return normalized;
}

function normalizeLegend(value: string | undefined): string | undefined {
  const normalized = value?.trim().toUpperCase();
  return normalized === undefined
    || normalized.length === 0
    || normalized === 'NONE'
    || !LEGEND_CODE_PATTERN.test(normalized)
    ? undefined
    : normalized;
}

function isLiveBacklogFile(backlogRoot: string, file: string): boolean {
  if (!file.startsWith(backlogRoot)) {
    return false;
  }
  const relativePath = relative(backlogRoot, file);
  return relativePath !== '' && !relativePath.startsWith('..') && !isAbsolute(relativePath);
}

function renderRetiredBody(reason: string, originalProposal: string, replacement?: string): string {
  const replacementLine = replacement === undefined ? '' : `\n\nReplacement: \`${replacement}\``;
  return [
    '## Disposition',
    '',
    `${reason}${replacementLine}`,
    '',
    '## Original Proposal',
    '',
    originalProposal.trim(),
  ].join('\n');
}

function sanitizeWitnessOutput(value: string, root: string): string {
  return value
    .replaceAll(root, '.')
    .replace(/\/Users\/[^/\s]+/gu, '<HOME>')
    .replace(/\/home\/[^/\s]+/gu, '<HOME>')
    .replace(/\/root\b/gu, '<ROOT>')
    .replace(/\/mnt\/[^/\s]+/gu, '<MNT>')
    .replace(/C:\\Users\\[^\\\s]+/gu, '<HOME>');
}
