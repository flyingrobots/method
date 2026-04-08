import { relative } from 'node:path';
import type { Cycle, Outcome, WorkspaceStatus } from './domain.js';
import { readHeading } from './frontmatter.js';

export function titleCase(value: string): string {
  return value
    .split('-')
    .filter((part) => part.length > 0)
    .map((part) => `${part[0].toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

export function renderBearing(status: WorkspaceStatus, closedCycles: Cycle[], commitSha: string): string {
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

export function renderWitnessDoc(options: {
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

export function renderDesignDoc(options: {
  cycleName: string;
  title: string;
  legend?: string;
  source: string;
  backlogBody: string;
}): string {
  const legendValue = options.legend ?? 'none';
  return [
    '---',
    `title: ${yamlString(options.title)}`,
    `legend: ${legendValue}`,
    `cycle: ${yamlString(options.cycleName)}`,
    `source_backlog: ${yamlString(options.source)}`,
    '---',
    '',
    `# ${options.title}`,
    '',
    `Source backlog item: \`${options.source}\``,
    `Legend: ${legendValue}`,
    '',
    '## Sponsors',
    '',
    '- Human: Backlog operator',
    '- Agent: Implementation agent',
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

export function renderRetroDoc(options: {
  cycle: Cycle;
  root: string;
  outcome: Outcome;
  witnessDir: string;
}): string {
  const title = readHeading(options.cycle.designDoc) || titleCase(options.cycle.slug);
  const designDoc = relative(options.root, options.cycle.designDoc);
  return [
    '---',
    `title: ${yamlString(title)}`,
    `cycle: ${yamlString(options.cycle.name)}`,
    `design_doc: ${yamlString(designDoc)}`,
    `outcome: ${options.outcome}`,
    'drift_check: yes',
    '---',
    '',
    `# ${title} Retro`,
    '',
    `Design: \`${designDoc}\``,
    `Outcome: ${options.outcome}`,
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

function yamlString(value: string): string {
  return `"${value.replace(/\\/gu, '\\\\').replace(/"/gu, '\\"')}"`;
}
