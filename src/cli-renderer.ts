import { headerBox, separator } from '@flyingrobots/bijou';
import { createNodeContext } from '@flyingrobots/bijou-node';
import type { WorkspaceStatus } from './domain.js';

export function renderStatus(status: WorkspaceStatus): string {
  const ctx = createNodeContext();
  const backlogLines = [
    ...Object.entries(status.backlog).map(([lane, items]) => {
      return `${lane.padEnd(10, ' ')} ${String(items.length).padStart(2, ' ')}  ${items.map((item) => item.stem).join(', ') || '-'}`;
    }),
  ];

  const cycleLines = status.activeCycles.length > 0
    ? status.activeCycles.map((cycle) => `${cycle.name.padEnd(18, ' ')} ${cycle.slug}`)
    : ['-'];

  const legendLines = status.legendHealth.length > 0
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
