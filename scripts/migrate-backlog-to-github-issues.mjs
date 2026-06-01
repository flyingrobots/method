#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse as parseYaml } from 'yaml';

const DEFAULT_BACKLOG_ROOT = 'docs/method/backlog';

const LABELS = new Map([
  ['lane:inbox', ['D0E8FF', 'Raw intake; needs triage before work starts.']],
  ['lane:asap', ['FFB3BA', 'Highest-priority Method lane; pull next.']],
  ['lane:bad-code', ['FFDFBA', 'Known debt, rot, or structural risk.']],
  ['lane:cool-ideas', ['D5E8D4', 'Interesting but not committed work.']],
  ['lane:release', ['E1D5E7', 'Release-scoped work; pair with a milestone.']],
  ['work-in-progress', ['FBCA04', 'Someone is actively working this issue.']],
  ['blocked', ['D93F0B', 'Blocked; cannot proceed without external input or dependency.']],
  ['needs-design', ['5319E7', 'Needs or is missing a Method design artifact.']],
  ['needs-playback', ['1D76DB', 'Needs playback review or verification.']],
  ['needs-witness', ['006B75', 'Needs reproducible witness evidence.']],
  ['needs-retro', ['7057FF', 'Needs Method retro/closeout evidence.']],
  ['legend:process', ['1D76DB', 'Method process, workflow, adapters, and CLI work.']],
  ['legend:synth', ['5319E7', 'Synthesis, signposts, executive summaries, provenance.']],
  ['legend:core', ['0052CC', 'Core Method runtime/domain behavior.']],
  ['priority:high', ['D93F0B', 'High priority.']],
  ['priority:medium', ['FBCA04', 'Medium priority.']],
  ['priority:low', ['C2E0C6', 'Low priority.']],
  ['type:bug', ['D73A4A', 'Defect or regression.']],
  ['type:enhancement', ['A2EEEF', 'Feature or improvement.']],
  ['type:docs', ['0075CA', 'Documentation work.']],
  ['type:spike', ['C5DEF5', 'Temporary proof or learning cycle.']],
  ['type:maintenance', ['BFDADC', 'Maintenance, cleanup, or operational workflow work.']],
]);

const CANONICAL_LABELS = [...LABELS.keys()];
const RELEASE_LANE_PATTERN = /^v\d+\.\d+\.\d+$/u;

function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = process.cwd();
  const backlogRoot = resolve(root, args.backlogRoot ?? DEFAULT_BACKLOG_ROOT);
  const repo = args.repo ?? process.env.GITHUB_REPO ?? currentGitHubRepo();
  const dryRun = args.dryRun;

  if (!repo.includes('/')) {
    fail('GitHub repo must be OWNER/REPO. Pass --repo OWNER/REPO or set GITHUB_REPO.');
  }
  if (!existsSync(backlogRoot)) {
    fail(`Backlog root does not exist: ${relative(root, backlogRoot)}`);
  }

  const cards = collectBacklogCards(root, backlogRoot);
  const existingIssues = loadExistingIssueMap(repo);
  if (!dryRun) {
    ensureLabels(repo, CANONICAL_LABELS);
  }

  const results = [];
  for (const card of cards) {
    const existing = existingIssues.get(card.relativePath);
    if (existing !== undefined) {
      results.push({ action: 'skip-existing', card, issue: existing });
      continue;
    }
    if (dryRun) {
      results.push({ action: 'create-dry-run', card });
      continue;
    }
    const issue = createIssue(repo, card);
    results.push({ action: 'created', card, issue });
  }

  if (args.json) {
    process.stdout.write(`${JSON.stringify(renderJson(results), null, 2)}\n`);
  } else {
    renderText(results, repo, dryRun);
  }
}

function parseArgs(argv) {
  const args = {
    dryRun: false,
    json: false,
    repo: undefined,
    backlogRoot: undefined,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--dry-run') {
      args.dryRun = true;
      continue;
    }
    if (arg === '--json') {
      args.json = true;
      continue;
    }
    if (arg === '--repo') {
      args.repo = requireValue(argv, (index += 1), '--repo');
      continue;
    }
    if (arg === '--backlog-root') {
      args.backlogRoot = requireValue(argv, (index += 1), '--backlog-root');
      continue;
    }
    if (arg === '--help' || arg === '-h') {
      process.stdout.write(helpText());
      process.exit(0);
    }
    fail(`Unknown argument: ${arg}\n\n${helpText()}`);
  }
  return args;
}

function requireValue(argv, index, flag) {
  const value = argv[index];
  if (value === undefined || value.startsWith('--')) {
    fail(`${flag} requires a value.`);
  }
  return value;
}

function helpText() {
  return [
    'Usage: npm run migrate -- [--repo OWNER/REPO] [--backlog-root PATH] [--dry-run] [--json]',
    '',
    'Migrates live Method backlog lane cards into GitHub Issues.',
    '',
    'Only files under docs/method/backlog/<lane>/*.md are migrated.',
    'Design docs, retros, witnesses, releases, and graveyard files are ignored.',
    '',
  ].join('\n');
}

function currentGitHubRepo() {
  const result = run('gh', ['repo', 'view', '--json', 'nameWithOwner', '--jq', '.nameWithOwner'], { allowFailure: true });
  return result.ok ? result.stdout.trim() : '';
}

function collectBacklogCards(root, backlogRoot) {
  const cards = [];
  for (const laneName of sortedDirNames(backlogRoot)) {
    const laneDir = join(backlogRoot, laneName);
    if (!statSync(laneDir).isDirectory()) {
      continue;
    }
    for (const fileName of sortedDirNames(laneDir)) {
      if (!fileName.endsWith('.md')) {
        continue;
      }
      const fullPath = join(laneDir, fileName);
      if (!statSync(fullPath).isFile()) {
        continue;
      }
      cards.push(readBacklogCard(root, backlogRoot, laneName, fullPath));
    }
  }
  return cards;
}

function sortedDirNames(dir) {
  return readdirSync(dir).sort((left, right) => left.localeCompare(right));
}

function readBacklogCard(root, backlogRoot, laneName, fullPath) {
  const raw = readFileSync(fullPath, 'utf8');
  const parsed = parseMarkdownDoc(raw);
  const relativePath = normalizeSourcePath(relative(root, fullPath));
  const stem = basename(fullPath, '.md');
  const filenameLegend = stem.includes('_') ? stem.split('_')[0] : undefined;
  const filenameSlug = stem.includes('_') ? stem.slice(stem.indexOf('_') + 1) : stem;
  const title = normalizeString(parsed.frontmatter.title) ?? firstHeading(parsed.body) ?? titleCase(filenameSlug);
  const lane = normalizeString(parsed.frontmatter.lane) ?? laneName;
  const legend = normalizeString(parsed.frontmatter.legend) ?? filenameLegend;
  const priority = normalizeString(parsed.frontmatter.priority);
  const labels = labelsFor({ lane, legend, priority });
  const body = renderIssueBody({ relativePath, lane, legend, priority, title, originalBody: parsed.body.trim() });
  return {
    fullPath,
    relativePath,
    title,
    lane,
    legend,
    priority,
    labels,
    body,
  };
}

function parseMarkdownDoc(raw) {
  if (!raw.startsWith('---\n')) {
    return { frontmatter: {}, body: raw };
  }
  const closeIndex = raw.indexOf('\n---\n', 4);
  if (closeIndex === -1) {
    return { frontmatter: {}, body: raw };
  }
  const yaml = raw.slice(4, closeIndex);
  const body = raw.slice(closeIndex + '\n---\n'.length);
  try {
    return { frontmatter: parseYaml(yaml) ?? {}, body };
  } catch {
    return { frontmatter: {}, body: raw };
  }
}

function firstHeading(body) {
  const match = /^#\s+(.+)$/mu.exec(body);
  return match?.[1]?.trim();
}

function normalizeString(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function labelsFor({ lane, legend, priority }) {
  const labels = [];
  labels.push(labelForLane(lane));

  if (legend !== undefined) {
    labels.push(`legend:${legend.toLowerCase()}`);
  }
  if (priority !== undefined) {
    labels.push(`priority:${priority.toLowerCase()}`);
  }
  if (lane === 'bad-code') {
    labels.push('type:maintenance');
  }
  if (legend?.toUpperCase() === 'SPIKE') {
    labels.push('type:spike');
  }
  return [...new Set(labels)];
}

function labelForLane(lane) {
  const laneValue = normalizeString(lane);
  if (laneValue === undefined) {
    throw new Error('Missing Method backlog lane.');
  }
  if (RELEASE_LANE_PATTERN.test(laneValue)) {
    return 'lane:release';
  }
  if (laneValue === 'up-next') {
    return 'lane:asap';
  }
  const label = `lane:${laneValue}`;
  if (!LABELS.has(label)) {
    throw new Error(`Unknown Method backlog lane "${laneValue}". Refusing to create non-canonical label ${label}.`);
  }
  return label;
}

function renderIssueBody({ relativePath, lane, legend, priority, title, originalBody }) {
  const metadata = [
    sourceBacklogMarker(relativePath),
    `Original lane: \`${lane}\``,
    legend === undefined ? undefined : `Original legend: \`${legend}\``,
    priority === undefined ? undefined : `Original priority: \`${priority}\``,
  ].filter(Boolean);

  return [
    '## Migrated from Method backlog',
    '',
    'This issue was created from a legacy filesystem backlog card. GitHub Issues are now the live work tracker; repository docs remain Method evidence.',
    '',
    ...metadata,
    '',
    '## Original backlog card',
    '',
    originalBody.length > 0 ? originalBody : `# ${title}`,
    '',
  ].join('\n');
}

function ensureLabels(repo, labels, runner) {
  const commandRunner = runner ?? run;
  const existingRaw = commandRunner('gh', [
    'api',
    `repos/${repo}/labels`,
    '--method',
    'GET',
    '--paginate',
    '-f',
    'per_page=100',
    '--jq',
    '.[].name',
  ]).stdout;
  const existing = new Set(existingRaw.split('\n').map((line) => line.trim()).filter(Boolean));
  for (const label of labels) {
    if (existing.has(label)) {
      continue;
    }
    const [color, description] = LABELS.get(label) ?? ['BFDADC', 'Migrated Method label.'];
    commandRunner('gh', ['label', 'create', label, '--repo', repo, '--color', color, '--description', description]);
    existing.add(label);
  }
}

function loadExistingIssueMap(repo, runner) {
  const commandRunner = runner ?? run;
  const result = commandRunner(
    'gh',
    [
      'api',
      `repos/${repo}/issues`,
      '--method',
      'GET',
      '--paginate',
      '-f',
      'state=all',
      '-f',
      'per_page=100',
      '--jq',
      '.[] | select(.pull_request == null) | {number,title,url:.html_url,state,body}',
    ],
  );
  if (!result.ok) {
    throw new Error(`Unable to load existing GitHub issues for ${repo}; aborting to avoid duplicate migration issues.`);
  }
  const issues = parseJsonLines(result.stdout);
  const bySourcePath = new Map();
  for (const issue of issues) {
    const body = typeof issue.body === 'string' ? issue.body : '';
    for (const relativePath of sourceBacklogPaths(body)) {
      const existing = bySourcePath.get(relativePath);
      if (existing !== undefined && existing.number !== issue.number) {
        throw new Error(
          `Duplicate Source backlog marker ${relativePath}: issue #${existing.number} ${existing.url} conflicts with issue #${issue.number} ${issue.url}`,
        );
      }
      if (existing === undefined) {
        bySourcePath.set(relativePath, {
          number: issue.number,
          title: issue.title,
          url: issue.url,
          state: issue.state,
        });
      }
    }
  }
  return bySourcePath;
}

function parseJsonLines(raw) {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function sourceBacklogMarker(relativePath) {
  return `Source backlog: \`${relativePath}\``;
}

function sourceBacklogPaths(body) {
  return [...body.matchAll(/Source backlog: `([^`]+)`/gu)]
    .map((match) => match[1])
    .filter(Boolean)
    .map((relativePath) => normalizeSourcePath(relativePath));
}

function normalizeSourcePath(relativePath) {
  return relativePath.replace(/\\/gu, '/');
}

function createIssue(repo, card, runner) {
  const commandRunner = runner ?? run;
  const dir = mkdtempSync(join(tmpdir(), 'method-migrate-'));
  const bodyFile = join(dir, 'body.md');
  try {
    writeFileSync(bodyFile, card.body, 'utf8');
    const args = ['issue', 'create', '--repo', repo, '--title', card.title, '--body-file', bodyFile];
    for (const label of card.labels) {
      args.push('--label', label);
    }
    const stdout = commandRunner('gh', args).stdout.trim();
    return { number: issueNumberFromCreateOutput(stdout), title: card.title, url: stdout, state: 'OPEN' };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function issueNumberFromCreateOutput(stdout) {
  const url = stdout.trim();
  const match = /\/issues\/(\d+)(?:[?#].*)?$/u.exec(url);
  if (match === null) {
    throw new Error(`Could not parse issue number from gh issue create output: ${JSON.stringify(stdout)}`);
  }
  const number = Number.parseInt(match[1], 10);
  if (!Number.isSafeInteger(number)) {
    throw new Error(`Could not parse issue number from gh issue create output: ${JSON.stringify(stdout)}`);
  }
  return number;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const ok = result.status === 0;
  if (!ok && !options.allowFailure) {
    fail(`${command} ${args.join(' ')} failed:\n${result.stderr || result.stdout}`);
  }
  return {
    ok,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    status: result.status ?? 1,
  };
}

function renderJson(results) {
  return results.map((result) => ({
    action: result.action,
    path: result.card.relativePath,
    title: result.card.title,
    labels: result.card.labels,
    issue: result.issue,
  }));
}

function renderText(results, repo, dryRun) {
  process.stdout.write(`Method backlog migration ${dryRun ? '(dry-run)' : '(apply)'} for ${repo}\n`);
  for (const result of results) {
    const issueText = result.issue === undefined ? '' : ` -> ${result.issue.url}`;
    process.stdout.write(`${result.action.padEnd(15)} ${result.card.relativePath}${issueText}\n`);
  }
  const created = results.filter((result) => result.action === 'created').length;
  const skipped = results.filter((result) => result.action === 'skip-existing').length;
  const dry = results.filter((result) => result.action === 'create-dry-run').length;
  process.stdout.write(`Summary: created=${created} skipped_existing=${skipped} dry_run=${dry}\n`);
}

function titleCase(slug) {
  return slug
    .split(/[-_]/u)
    .filter(Boolean)
    .map((word) => `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`)
    .join(' ');
}

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

export {
  CANONICAL_LABELS,
  collectBacklogCards,
  createIssue,
  ensureLabels,
  labelsFor,
  loadExistingIssueMap,
  parseMarkdownDoc,
  renderIssueBody,
  renderJson,
  normalizeSourcePath,
  sourceBacklogMarker,
  sourceBacklogPaths,
  titleCase,
};

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
