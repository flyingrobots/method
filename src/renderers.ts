import * as path from 'node:path';
import { type BacklogItem, type Cycle, isCanonicalLane, type Outcome, orderedBacklogLaneNames, type WorkspaceStatus } from './domain.js';
import { readHeading } from './frontmatter.js';

export interface WitnessTestResult {
  command?: string;
  output: string;
  status: 'passed' | 'failed' | 'not-run';
}

export interface WitnessDriftResult {
  command: string;
  exitCode: 0 | 2;
  output: string;
}

export function titleCase(value: string): string {
  return value
    .split('-')
    .filter((part) => part.length > 0)
    .map((part) => `${part[0].toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

export function renderBearing(status: WorkspaceStatus, closedCycles: Cycle[], commitSha: string): string {
  const latestShips = [...closedCycles].reverse().slice(0, 3);
  const asap = status.backlog.asap ?? [];
  const nextUp = asap.slice(0, 2);
  const customPriorityLane = firstCustomPriorityLane(status);
  const frictionLines = deriveBearingFriction(status);
  const priorityLine =
    nextUp.length > 0
      ? `Current priority: pull ${nextUp.map((i) => `\`${i.stem}\``).join(' or ')} to continue the system's maturity.`
      : customPriorityLane !== undefined
        ? `Current priority: focus \`${customPriorityLane.lane}\` by pulling ${customPriorityLane.items.map((item) => `\`${item.stem}\``).join(' or ')}.`
        : 'Current priority: no explicit `asap` item is currently recorded.';

  const shipLines = latestShips.map((cycle) => {
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
    priorityLine,
    '',
    '## What just shipped?',
    '',
    ...shipLines,
    '',
    '## What feels wrong?',
    '',
    ...frictionLines,
    '',
  ].join('\n');
}

function deriveBearingFriction(status: WorkspaceStatus): string[] {
  const lines: string[] = [];
  const inbox = status.backlog.inbox ?? [];
  const asap = status.backlog.asap ?? [];
  const badCode = status.backlog['bad-code'] ?? [];

  if (inbox.length > 0) {
    lines.push(`- Inbox still holds ${inbox.length} untriaged item(s).`);
  }
  if (asap.length > 0) {
    lines.push(`- ${asap.length} ASAP backlog item(s) are still unresolved.`);
  }
  if (badCode.length > 0) {
    lines.push(`- ${badCode.length} bad-code item(s) remain tracked.`);
  }
  if (status.activeCycles.length > 0) {
    lines.push(`- ${status.activeCycles.length} active cycle(s) are still open.`);
  }

  return lines.length > 0 ? lines : ['- No acute coordination pain is currently recorded.'];
}

function firstCustomPriorityLane(status: WorkspaceStatus): { lane: string; items: BacklogItem[] } | undefined {
  for (const lane of orderedBacklogLaneNames(Object.keys(status.backlog))) {
    if (lane === 'root' || isCanonicalLane(lane)) {
      continue;
    }

    const items = (status.backlog[lane] ?? []).slice(0, 2);
    if (items.length > 0) {
      return { lane, items };
    }
  }

  return undefined;
}

export function renderWitnessDoc(options: { cycle: Cycle; testResult: WitnessTestResult; driftResult: WitnessDriftResult }): string {
  const title = readHeading(options.cycle.designDoc) || titleCase(options.cycle.slug);
  const testResult =
    options.testResult.output.trim().length === 0
      ? options.testResult.status === 'not-run'
        ? 'No automated test command was configured for this workspace.'
        : 'No test output captured.'
      : options.testResult.output;
  const driftResult = options.driftResult.output.trim().length === 0 ? 'No drift output captured.' : options.driftResult.output;
  const automatedCaptureLines =
    options.testResult.status === 'passed'
      ? [`- [x] Test command succeeded: \`${options.testResult.command}\`.`]
      : options.testResult.status === 'failed'
        ? [`- [ ] Test command failed: \`${options.testResult.command}\`.`]
        : ['- [ ] No automated test command was configured for this workspace.'];
  automatedCaptureLines.push(
    options.driftResult.exitCode === 0
      ? `- [x] Drift check passed: \`${options.driftResult.command}\`.`
      : `- [ ] Drift check reported playback-question drift: \`${options.driftResult.command}\`.`,
  );
  const replayCommands = [options.testResult.command, options.driftResult.command].filter(
    (command): command is string => command !== undefined,
  );
  const expectationLines =
    options.testResult.status === 'passed'
      ? ['Expected: the recorded test command exits successfully.']
      : options.testResult.status === 'failed'
        ? ['Expected: the recorded test command currently fails; inspect the captured output before closing the cycle.']
        : ['Expected: no automated test command was recorded; use repo-specific verification steps before closing the cycle.'];
  expectationLines.push(
    options.driftResult.exitCode === 0
      ? 'Expected: the recorded drift command exits 0.'
      : 'Expected: the recorded drift command currently reports playback-question drift.',
  );
  return [
    '---',
    `title: "Verification Witness for Cycle ${options.cycle.name}"`,
    '---',
    '',
    `# Verification Witness for Cycle ${options.cycle.name}`,
    '',
    `This witness proves that \`${title}\` now carries the required`,
    'behavior and adheres to the repo invariants.',
    '',
    '## Test Results',
    '',
    '```text',
    testResult,
    '```',
    '',
    '## Drift Results',
    '',
    '```text',
    driftResult,
    '```',
    '',
    '## Automated Capture',
    '',
    ...automatedCaptureLines,
    '',
    '## Human Verification',
    '',
    'To reproduce this verification independently from the workspace root:',
    '',
    '```sh',
    ...replayCommands,
    '```',
    '',
    ...expectationLines,
    '',
  ].join('\n');
}

export function renderDesignDoc(options: {
  cycleName: string;
  title: string;
  legend?: string;
  source: string;
  backlogBody: string;
  release?: string;
}): string {
  const legendValue = options.legend ?? 'none';
  const sourcePath = normalizeRepoPath(options.source);
  return [
    '---',
    `title: ${yamlString(options.title)}`,
    `legend: ${yamlString(legendValue)}`,
    `cycle: ${yamlString(options.cycleName)}`,
    ...(options.release === undefined ? [] : [`release: ${yamlString(options.release)}`]),
    `source_backlog: ${yamlString(sourcePath)}`,
    '---',
    '',
    `# ${options.title}`,
    '',
    `Source backlog item: \`${sourcePath}\``,
    `Legend: ${legendValue}`,
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
  release?: string;
  summary?: string;
  surprised?: string;
  differently?: string;
  followUp?: string;
}): string {
  if (options.outcome !== 'hill-met' && options.outcome !== 'partial' && options.outcome !== 'not-met') {
    throw new Error('Outcome is required and must be one of: hill-met, partial, not-met.');
  }
  const title = readHeading(options.cycle.designDoc) || titleCase(options.cycle.slug);
  const designDoc = normalizeRepoPath(path.relative(options.root, options.cycle.designDoc));
  const witnessDir = normalizeRepoPath(options.witnessDir);
  return [
    '---',
    `title: ${yamlString(title)}`,
    `cycle: ${yamlString(options.cycle.name)}`,
    ...(options.release === undefined ? [] : [`release: ${yamlString(options.release)}`]),
    `design_doc: ${yamlString(designDoc)}`,
    `outcome: ${options.outcome}`,
    'drift_check: yes',
    '---',
    '',
    `# ${title} Retro`,
    '',
    '## Summary',
    '',
    options.summary?.trim() || 'TBD',
    '',
    '## Playback Witness',
    '',
    `Artifacts under \`${witnessDir}\`.`,
    '',
    '## What surprised you?',
    '',
    options.surprised?.trim() || 'Nothing unexpected.',
    '',
    '## What would you do differently?',
    '',
    options.differently?.trim() || 'No changes to approach.',
    '',
    '## Follow-up items',
    '',
    options.followUp?.trim() || '- None.',
    '',
  ].join('\n');
}

function yamlString(value: string): string {
  return `"${value
    .replace(/\\/gu, '\\\\')
    .replace(/"/gu, '\\"')
    .replace(/\r\n/gu, '\\r\\n')
    .replace(/\r/gu, '\\r')
    .replace(/\n/gu, '\\n')}"`;
}

function normalizeRepoPath(value: string): string {
  return value.replace(/\\/gu, '/');
}
