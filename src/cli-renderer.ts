import { headerBox, separator } from '@flyingrobots/bijou';
import { createNodeContext } from '@flyingrobots/bijou-node';
import type { BacklogQueryResult, NextWorkResult, WorkspaceStatus } from './domain.js';
import type { BacklogDependencyReport } from './index.js';

export function renderStatus(status: WorkspaceStatus): string {
  const ctx = createNodeContext();
  const laneWidth = Math.max(10, ...Object.keys(status.backlog).map((lane) => lane.length));
  const backlogLines = [
    ...Object.entries(status.backlog).map(([lane, items]) => {
      return `${lane.padEnd(laneWidth, ' ')} ${String(items.length).padStart(2, ' ')}  ${items.map((item) => item.stem).join(', ') || '-'}`;
    }),
  ];

  const cycleLines =
    status.activeCycles.length > 0 ? status.activeCycles.map((cycle) => `${cycle.name.padEnd(18, ' ')} ${cycle.slug}`) : ['-'];

  const legendLines =
    status.legendHealth.length > 0
      ? status.legendHealth.map(({ legend, backlog, active }) => `${legend.padEnd(8, ' ')} backlog=${backlog} active=${active}`)
      : ['-'];

  return [
    `${headerBox('METHOD Status', { detail: status.root, ctx })}`,
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

export function renderSignpostStatus(result: {
  root: string;
  signposts: Array<{ name: string; path: string; kind: string; exists: boolean; initable: boolean }>;
  missing: string[];
}): string {
  const ctx = createNodeContext();
  const lines = result.signposts.map(
    (signpost) =>
      `${signpost.name.padEnd(12, ' ')} ${signpost.exists ? 'present' : 'missing'} ${signpost.kind.padEnd(13, ' ')} ${signpost.initable ? 'initable' : 'manual  '} ${signpost.path}`,
  );

  return [
    `${headerBox('METHOD Signposts', { detail: result.root, ctx })}`,
    '',
    `${separator({ label: 'Inventory', ctx })}`,
    ...lines,
    '',
    `${separator({ label: 'Missing', ctx })}`,
    ...(result.missing.length === 0 ? ['-'] : result.missing.map((path) => `- ${path}`)),
    '',
  ].join('\n');
}

export function renderSignpostInit(result: { requested: string; initializedTargets: string[]; skippedPaths: string[] }): string {
  const ctx = createNodeContext();
  return [
    `${headerBox('METHOD Signpost Init', { detail: result.requested, ctx })}`,
    '',
    `${separator({ label: 'Initialized', ctx })}`,
    ...(result.initializedTargets.length === 0 ? ['-'] : result.initializedTargets.map((path) => `- ${path}`)),
    '',
    `${separator({ label: 'Skipped', ctx })}`,
    ...(result.skippedPaths.length === 0 ? ['-'] : result.skippedPaths.map((path) => `- ${path}`)),
    '',
  ].join('\n');
}

export function renderBacklogQuery(result: BacklogQueryResult): string {
  const ctx = createNodeContext();
  const filterParts = [
    result.filters.lane === undefined ? undefined : `lane=${result.filters.lane}`,
    result.filters.legend === undefined ? undefined : `legend=${result.filters.legend}`,
    result.filters.priority === undefined ? undefined : `priority=${result.filters.priority}`,
    result.filters.keyword === undefined ? undefined : `keyword=${result.filters.keyword}`,
    result.filters.owner === undefined ? undefined : `owner=${result.filters.owner}`,
    result.filters.ready === undefined ? undefined : `ready=${result.filters.ready}`,
    result.filters.hasAcceptanceCriteria === undefined ? undefined : `has_acceptance_criteria=${result.filters.hasAcceptanceCriteria}`,
    result.filters.blockedBy === undefined ? undefined : `blocked_by=${result.filters.blockedBy}`,
    result.filters.blocks === undefined ? undefined : `blocks=${result.filters.blocks}`,
    `sort=${result.filters.sort}`,
    `limit=${result.filters.limit}`,
  ].filter((value): value is string => value !== undefined);
  const lines =
    result.items.length === 0
      ? ['-']
      : result.items.map((item) => {
          const details = [
            item.lane,
            item.legend === undefined ? 'untagged' : item.legend,
            item.priority === undefined ? undefined : `priority=${item.priority}`,
            item.owner === undefined ? undefined : `owner=${item.owner}`,
            item.keywords.length === 0 ? undefined : `keywords=${item.keywords.join(', ')}`,
            item.blockedBy.length === 0 ? 'ready=true' : `blocked_by=${item.blockedBy.join(', ')}`,
            item.blocks.length === 0 ? undefined : `blocks=${item.blocks.join(', ')}`,
            item.hasAcceptanceCriteria ? 'has_acceptance_criteria=true' : undefined,
          ].filter((value): value is string => value !== undefined);
          return `${item.stem}  ${details.join('  ')}`;
        });

  return [
    `${headerBox('METHOD Backlog Query', { detail: result.root, ctx })}`,
    '',
    `${separator({ label: 'Filters', ctx })}`,
    filterParts.join(', '),
    '',
    `${separator({ label: 'Summary', ctx })}`,
    `returned=${result.returnedCount} total=${result.totalCount} truncated=${result.truncated ? 'yes' : 'no'}`,
    '',
    `${separator({ label: 'Items', ctx })}`,
    ...lines,
    '',
  ].join('\n');
}

export function renderNextWork(result: NextWorkResult): string {
  const ctx = createNodeContext();
  const laneCounts = Object.entries(result.summary.lane_counts)
    .map(([lane, count]) => `${lane}=${count}`)
    .join(', ');
  const recommendationLines =
    result.recommendations.length === 0
      ? ['-']
      : result.recommendations.flatMap((item, index) => [
          `${index + 1}. ${item.title} [${item.scoreBand}]`,
          `   ${item.path}  lane=${item.lane}${item.priority === undefined ? '' : `  priority=${item.priority}`}`,
          ...item.whyNow.map((reason) => `   - ${reason}`),
        ]);

  return [
    `${headerBox('METHOD Next Work', { detail: result.generated_at, ctx })}`,
    '',
    `${separator({ label: 'Summary', ctx })}`,
    `active_cycles=${result.summary.active_cycle_count}`,
    laneCounts,
    `bearing_priority=${result.summary.bearing_priority ?? '-'}`,
    `bearing_concerns=${result.summary.bearing_concerns.length === 0 ? '-' : result.summary.bearing_concerns.join(' | ')}`,
    '',
    `${separator({ label: 'Recommendations', ctx })}`,
    ...recommendationLines,
    '',
    `${separator({ label: 'Notes', ctx })}`,
    ...(result.selection_notes.length === 0 ? ['-'] : result.selection_notes.map((note) => `- ${note}`)),
    '',
  ].join('\n');
}

export function renderBacklogDependencies(result: BacklogDependencyReport): string {
  const ctx = createNodeContext();

  if (result.query.readyOnly) {
    return [
      `${headerBox('METHOD Backlog Dependencies', { detail: result.root, ctx })}`,
      '',
      `${separator({ label: 'Ready Items', ctx })}`,
      ...(result.ready.length === 0 ? ['-'] : result.ready.map((item) => `- ${item.stem} (${item.lane})`)),
      '',
      `${separator({ label: 'Summary', ctx })}`,
      `items=${result.items.length} edges=${result.edges.length} cycles=${result.cycles.length}`,
      '',
    ].join('\n');
  }

  if (result.focus !== undefined) {
    return [
      `${headerBox('METHOD Backlog Dependencies', { detail: result.focus.item.path, ctx })}`,
      '',
      `${separator({ label: 'Item', ctx })}`,
      `${result.focus.item.stem} lane=${result.focus.item.lane} ready=${result.focus.item.ready ? 'yes' : 'no'}`,
      ...(result.focus.item.unresolvedBlockedBy.length === 0
        ? []
        : [`unresolved blocked_by: ${result.focus.item.unresolvedBlockedBy.join(', ')}`]),
      ...(result.focus.item.unresolvedBlocks.length === 0 ? [] : [`unresolved blocks: ${result.focus.item.unresolvedBlocks.join(', ')}`]),
      '',
      `${separator({ label: 'Blocked By', ctx })}`,
      ...(result.focus.blockers.length === 0 ? ['-'] : result.focus.blockers.map((item) => `- ${item.stem}`)),
      '',
      `${separator({ label: 'Blocks', ctx })}`,
      ...(result.focus.blocked.length === 0 ? ['-'] : result.focus.blocked.map((item) => `- ${item.stem}`)),
      '',
      ...(result.query.criticalPath
        ? [
            `${separator({ label: 'Critical Path', ctx })}`,
            ...(result.focus.criticalPathReason === undefined
              ? result.focus.criticalPath.length === 0
                ? ['-']
                : result.focus.criticalPath.map((item) => `- ${item.stem}`)
              : [result.focus.criticalPathReason]),
            '',
          ]
        : []),
      `${separator({ label: 'Cycles', ctx })}`,
      ...(result.cycles.length === 0 ? ['-'] : result.cycles.map((cycle) => `- ${cycle.join(' -> ')}`)),
      '',
    ].join('\n');
  }

  return [
    `${headerBox('METHOD Backlog Dependencies', { detail: result.root, ctx })}`,
    '',
    `${separator({ label: 'Summary', ctx })}`,
    `items=${result.items.length} edges=${result.edges.length} ready=${result.ready.length} cycles=${result.cycles.length}`,
    '',
    `${separator({ label: 'Ready Items', ctx })}`,
    ...(result.ready.length === 0 ? ['-'] : result.ready.map((item) => `- ${item.stem}`)),
    '',
    `${separator({ label: 'Edges', ctx })}`,
    ...(result.edges.length === 0 ? ['-'] : result.edges.map((edge) => `- ${pathToStem(edge.blocker)} -> ${pathToStem(edge.blocked)}`)),
    '',
  ].join('\n');
}

function pathToStem(path: string): string {
  const stem = path.split('/').at(-1) ?? path;
  return stem.endsWith('.md') ? stem.slice(0, -3) : stem;
}
