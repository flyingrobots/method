import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const REVIEW_STATE_STATUSES = ['ready', 'blocked', 'no-pr', 'ambiguous-pr'] as const;
const REVIEW_DECISIONS = ['APPROVED', 'CHANGES_REQUESTED', 'REVIEW_REQUIRED', 'NONE'] as const;
const BOT_REVIEW_STATES = ['none', 'pending', 'approved', 'changes_requested', 'commented'] as const;
const BLOCKER_TYPES = [
  'selection',
  'review_decision',
  'unresolved_threads',
  'pending_checks',
  'failing_checks',
  'bot_review',
  'policy_cooldown',
] as const;

type ReviewStateStatus = typeof REVIEW_STATE_STATUSES[number];
type ReviewDecision = typeof REVIEW_DECISIONS[number];
type BotReviewState = typeof BOT_REVIEW_STATES[number];
type ReviewStateBlockerType = typeof BLOCKER_TYPES[number];

export interface ReviewCheck {
  name: string;
  status: string;
  url: string | null;
}

export interface ReviewStateBlocker {
  type: ReviewStateBlockerType;
  message: string;
  source: string;
}

export interface ReviewStateResult {
  status: ReviewStateStatus;
  pr_number: number | null;
  pr_url: string | null;
  review_decision: ReviewDecision;
  unresolved_thread_count: number;
  checks: {
    passing: ReviewCheck[];
    pending: ReviewCheck[];
    failing: ReviewCheck[];
  };
  bot_review_state: BotReviewState;
  approval_count: number;
  changes_requested_count: number;
  merge_ready: boolean;
  blockers: ReviewStateBlocker[];
}

export interface ReviewStateQueryOptions {
  cwd: string;
  pr?: number;
  currentBranch?: boolean;
  client?: ReviewStateClient;
}

export interface ReviewStateClient {
  ghJson<T>(cwd: string, args: readonly string[]): Promise<T>;
  gitText(cwd: string, args: readonly string[]): Promise<string>;
}

interface PullRequestCandidate {
  number: number;
  url?: string | null;
}

interface GhOwner {
  login?: string | null;
}

interface GhRepoViewResponse {
  owner?: GhOwner | null;
  name?: string | null;
}

interface GhCheckRun {
  __typename?: string | null;
  completedAt?: string | null;
  conclusion?: string | null;
  context?: string | null;
  detailsUrl?: string | null;
  name?: string | null;
  startedAt?: string | null;
  state?: string | null;
  status?: string | null;
  targetUrl?: string | null;
  workflowName?: string | null;
}

interface GhReviewAuthor {
  login?: string | null;
}

interface GhReview {
  author?: GhReviewAuthor | null;
  body?: string | null;
  state?: string | null;
  submittedAt?: string | null;
}

interface GhComment {
  author?: GhReviewAuthor | null;
  body?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

interface GhPrViewResponse {
  number?: number | null;
  url?: string | null;
  reviewDecision?: string | null;
  statusCheckRollup?: GhCheckRun[] | null;
  reviews?: GhReview[] | null;
  comments?: GhComment[] | null;
}

interface ReviewThreadsQueryResponse {
  data?: {
    repository?: {
      pullRequest?: {
        reviewThreads?: {
          pageInfo?: {
            hasNextPage?: boolean | null;
            endCursor?: string | null;
          } | null;
          nodes?: Array<{
            isResolved?: boolean | null;
            isOutdated?: boolean | null;
          }> | null;
        } | null;
      } | null;
    } | null;
  } | null;
}

interface TimedSignal {
  source: string;
  timestamp: number;
  body?: string;
}

interface BotReviewSignal extends TimedSignal {
  state?: string;
}

interface BotCheckSignal extends TimedSignal {
  status: string;
}

export async function queryReviewState(options: ReviewStateQueryOptions): Promise<ReviewStateResult> {
  const pr = options.pr;
  const currentBranch = options.currentBranch ?? pr === undefined;
  if (pr === undefined && currentBranch !== true) {
    throw new Error('review-state requires either --pr or --current-branch; cannot use currentBranch:false with no PR.');
  }
  if (pr !== undefined && currentBranch) {
    throw new Error('review-state accepts either --pr or --current-branch, not both.');
  }

  const client = options.client ?? createExecReviewStateClient();
  let selection:
    | { kind: 'selected'; prNumber: number }
    | { kind: 'no-pr'; message: string }
    | { kind: 'ambiguous-pr'; message: string };
  if (currentBranch) {
    selection = await resolveCurrentBranchPr(options.cwd, client);
  } else {
    selection = { kind: 'selected', prNumber: requirePositiveInteger(pr, 'PR number') };
  }

  if (selection.kind === 'no-pr') {
    return selectionResult('no-pr', selection.message);
  }
  if (selection.kind === 'ambiguous-pr') {
    return selectionResult('ambiguous-pr', selection.message);
  }

  const [repo, prView] = await Promise.all([
    client.ghJson<GhRepoViewResponse>(options.cwd, ['repo', 'view', '--json', 'owner,name']),
    client.ghJson<GhPrViewResponse>(
      options.cwd,
      ['pr', 'view', String(selection.prNumber), '--json', 'number,url,reviewDecision,statusCheckRollup,reviews,comments'],
    ),
  ]);

  const owner = repo.owner?.login?.trim();
  const name = repo.name?.trim();
  if (!owner || !name) {
    throw new Error('Could not resolve GitHub repository owner/name from gh repo view.');
  }

  const unresolvedThreadCount = await fetchUnresolvedThreadCount(options.cwd, client, owner, name, selection.prNumber);
  return buildReviewStateResult({
    prNumber: requirePositiveInteger(prView.number, 'GitHub PR number'),
    prUrl: normalizeOptionalString(prView.url),
    reviewDecision: normalizeReviewDecision(prView.reviewDecision),
    unresolvedThreadCount,
    statusChecks: prView.statusCheckRollup ?? [],
    reviews: prView.reviews ?? [],
    comments: prView.comments ?? [],
  });
}

export function renderReviewStateText(result: ReviewStateResult): string {
  const lines = [
    `Review state: ${result.status}`,
    result.pr_number === null ? 'PR: -' : `PR: #${result.pr_number} ${result.pr_url ?? '-'}`,
    `Review decision: ${result.review_decision}`,
    `Unresolved threads: ${result.unresolved_thread_count}`,
    `Checks: passing=${result.checks.passing.length} pending=${result.checks.pending.length} failing=${result.checks.failing.length}`,
    `Bot review: ${result.bot_review_state}`,
    `Approvals: ${result.approval_count}`,
    `Changes requested: ${result.changes_requested_count}`,
    `Merge ready: ${result.merge_ready ? 'yes' : 'no'}`,
  ];

  if (result.blockers.length === 0) {
    lines.push('Blockers: none');
    return lines.join('\n');
  }

  lines.push('Blockers:');
  for (const blocker of result.blockers) {
    lines.push(`- ${blocker.type} [${blocker.source}] ${blocker.message}`);
  }
  return lines.join('\n');
}

export function createExecReviewStateClient(): ReviewStateClient {
  return {
    async ghJson<T>(cwd: string, args: readonly string[]): Promise<T> {
      const stdout = await runCommand('gh', args, cwd);
      return JSON.parse(stdout) as T;
    },
    async gitText(cwd: string, args: readonly string[]): Promise<string> {
      return runCommand('git', args, cwd);
    },
  };
}

async function runCommand(command: string, args: readonly string[], cwd: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync(command, [...args], {
      cwd,
      encoding: 'utf8',
      timeout: 30_000,
      env: { ...process.env, GH_PAGER: 'cat' },
    });
    return stdout;
  } catch (error: unknown) {
    const stdout = typeof error === 'object' && error !== null && 'stdout' in error ? String((error as { stdout?: string }).stdout ?? '') : '';
    const stderr = typeof error === 'object' && error !== null && 'stderr' in error ? String((error as { stderr?: string }).stderr ?? '') : '';
    const message = [stdout.trim(), stderr.trim()].filter((value) => value.length > 0).join('\n');
    throw new Error(message.length > 0 ? message : `${command} ${args.join(' ')} failed.`);
  }
}

async function resolveCurrentBranchPr(
  cwd: string,
  client: ReviewStateClient,
): Promise<
  | { kind: 'selected'; prNumber: number }
  | { kind: 'no-pr'; message: string }
  | { kind: 'ambiguous-pr'; message: string }
> {
  const branch = (await client.gitText(cwd, ['rev-parse', '--abbrev-ref', 'HEAD'])).trim();
  if (branch.length === 0 || branch === 'HEAD') {
    return { kind: 'no-pr', message: 'No PR found for current branch (detached HEAD).' };
  }

  const matches = await client.ghJson<PullRequestCandidate[]>(
    cwd,
    ['pr', 'list', '--head', branch, '--state', 'open', '--json', 'number,url'],
  );

  if (matches.length === 0) {
    return { kind: 'no-pr', message: `No PR found for current branch: ${branch}.` };
  }
  if (matches.length > 1) {
    return {
      kind: 'ambiguous-pr',
      message: `Multiple PRs match current branch (${branch}); rerun with --pr <number>.`,
    };
  }

  return { kind: 'selected', prNumber: requirePositiveInteger(matches[0]?.number, 'GitHub PR number') };
}

async function fetchUnresolvedThreadCount(
  cwd: string,
  client: ReviewStateClient,
  owner: string,
  repo: string,
  prNumber: number,
): Promise<number> {
  const query = [
    'query($owner: String!, $repo: String!, $pr: Int!, $cursor: String) {',
    '  repository(owner: $owner, name: $repo) {',
    '    pullRequest(number: $pr) {',
    '      reviewThreads(first: 100, after: $cursor) {',
    '        pageInfo { hasNextPage endCursor }',
    '        nodes { isResolved isOutdated }',
    '      }',
    '    }',
    '  }',
    '}',
  ].join('\n');

  let total = 0;
  let cursor: string | undefined;
  while (true) {
    const args = [
      'api',
      'graphql',
      '-F',
      `owner=${owner}`,
      '-F',
      `repo=${repo}`,
      '-F',
      `pr=${prNumber}`,
      '-f',
      `query=${query}`,
    ];
    if (cursor !== undefined) {
      args.push('-F', `cursor=${cursor}`);
    }

    const response = await client.ghJson<ReviewThreadsQueryResponse>(cwd, args);
    const reviewThreads = response.data?.repository?.pullRequest?.reviewThreads;
    const nodes = reviewThreads?.nodes ?? [];
    total += nodes.filter((thread) => thread.isResolved !== true && thread.isOutdated !== true).length;

    const nextCursor = reviewThreads?.pageInfo?.endCursor ?? undefined;
    if (reviewThreads?.pageInfo?.hasNextPage === true && nextCursor !== undefined && nextCursor !== cursor) {
      cursor = nextCursor;
      continue;
    }
    break;
  }
  return total;
}

function buildReviewStateResult(input: {
  prNumber: number;
  prUrl: string | undefined;
  reviewDecision: ReviewDecision;
  unresolvedThreadCount: number;
  statusChecks: GhCheckRun[];
  reviews: GhReview[];
  comments: GhComment[];
}): ReviewStateResult {
  const checks = classifyChecks(input.statusChecks);
  const humanDecisions = latestDecisiveStates(input.reviews.filter((review) => !isBotLogin(review.author?.login)));
  const approvalCount = [...humanDecisions.values()].filter((state) => state === 'APPROVED').length;
  const changesRequestedCount = [...humanDecisions.values()].filter((state) => state === 'CHANGES_REQUESTED').length;
  const botSignals = analyzeBotSignals(input.reviews, input.comments, input.statusChecks);

  const blockers: ReviewStateBlocker[] = [];
  if (input.unresolvedThreadCount > 0) {
    blockers.push({
      type: 'unresolved_threads',
      message: `${input.unresolvedThreadCount} unresolved review thread${input.unresolvedThreadCount === 1 ? '' : 's'}.`,
      source: 'github',
    });
  }
  if (checks.failing.length > 0) {
    blockers.push({
      type: 'failing_checks',
      message: `${checks.failing.length} failing check${checks.failing.length === 1 ? '' : 's'}.`,
      source: 'github',
    });
  }
  if (checks.pending.length > 0) {
    blockers.push({
      type: 'pending_checks',
      message: `${checks.pending.length} pending check${checks.pending.length === 1 ? '' : 's'}.`,
      source: 'github',
    });
  }
  if (input.reviewDecision === 'REVIEW_REQUIRED') {
    blockers.push({
      type: 'review_decision',
      message: 'reviewDecision is REVIEW_REQUIRED.',
      source: 'github',
    });
  } else if (input.reviewDecision === 'CHANGES_REQUESTED' && input.unresolvedThreadCount === 0) {
    blockers.push({
      type: 'review_decision',
      message: 'reviewDecision still CHANGES_REQUESTED.',
      source: 'github',
    });
  }
  if (botSignals.cooldownMessage !== undefined) {
    blockers.push({
      type: 'policy_cooldown',
      message: botSignals.cooldownMessage,
      source: botSignals.source,
    });
  } else if (botSignals.state === 'pending') {
    blockers.push({
      type: 'bot_review',
      message: `${displayBotSource(botSignals.source)} review in progress.`,
      source: botSignals.source,
    });
  } else if (botSignals.state === 'changes_requested') {
    blockers.push({
      type: 'bot_review',
      message: `${displayBotSource(botSignals.source)} requested changes.`,
      source: botSignals.source,
    });
  }

  const mergeReady = blockers.length === 0;
  return {
    status: mergeReady ? 'ready' : 'blocked',
    pr_number: input.prNumber,
    pr_url: input.prUrl ?? null,
    review_decision: input.reviewDecision,
    unresolved_thread_count: input.unresolvedThreadCount,
    checks,
    bot_review_state: botSignals.state,
    approval_count: approvalCount,
    changes_requested_count: changesRequestedCount,
    merge_ready: mergeReady,
    blockers,
  };
}

function selectionResult(status: Extract<ReviewStateStatus, 'no-pr' | 'ambiguous-pr'>, message: string): ReviewStateResult {
  return {
    status,
    pr_number: null,
    pr_url: null,
    review_decision: 'NONE',
    unresolved_thread_count: 0,
    checks: { passing: [], pending: [], failing: [] },
    bot_review_state: 'none',
    approval_count: 0,
    changes_requested_count: 0,
    merge_ready: false,
    blockers: [{ type: 'selection', message, source: 'github' }],
  };
}

function classifyChecks(items: GhCheckRun[]): ReviewStateResult['checks'] {
  const passing: ReviewCheck[] = [];
  const pending: ReviewCheck[] = [];
  const failing: ReviewCheck[] = [];

  for (const item of items) {
    const check = toReviewCheck(item);
    if (isPendingCheck(item)) {
      pending.push(check);
      continue;
    }
    if (isFailingCheck(item)) {
      failing.push(check);
      continue;
    }
    if (check.status.length > 0) {
      passing.push(check);
    }
  }

  return { passing, pending, failing };
}

function toReviewCheck(item: GhCheckRun): ReviewCheck {
  return {
    name: normalizeCheckName(item),
    status: normalizeCheckStatus(item),
    url: normalizeOptionalString(item.detailsUrl) ?? normalizeOptionalString(item.targetUrl) ?? null,
  };
}

function normalizeCheckName(item: GhCheckRun): string {
  const base = normalizeOptionalString(item.name) ?? normalizeOptionalString(item.context) ?? 'unknown';
  const workflow = normalizeOptionalString(item.workflowName);
  if (workflow !== undefined && workflow !== base) {
    return `${workflow} / ${base}`;
  }
  return base;
}

function normalizeCheckStatus(item: GhCheckRun): string {
  if (item.__typename === 'CheckRun') {
    if (normalizeOptionalString(item.status)?.toUpperCase() !== 'COMPLETED') {
      return normalizeOptionalString(item.status)?.toUpperCase() ?? 'UNKNOWN';
    }
    return normalizeOptionalString(item.conclusion)?.toUpperCase() ?? 'COMPLETED';
  }
  return normalizeOptionalString(item.state)?.toUpperCase() ?? 'UNKNOWN';
}

function isPendingCheck(item: GhCheckRun): boolean {
  const status = normalizeCheckStatus(item);
  return ['PENDING', 'IN_PROGRESS', 'QUEUED', 'EXPECTED', 'WAITING', 'REQUESTED'].includes(status);
}

function isFailingCheck(item: GhCheckRun): boolean {
  const status = normalizeCheckStatus(item);
  return ['FAILURE', 'FAILED', 'ERROR', 'CANCELLED', 'ACTION_REQUIRED', 'TIMED_OUT', 'STALE', 'STARTUP_FAILURE'].includes(status);
}

function latestDecisiveStates(reviews: GhReview[]): Map<string, 'APPROVED' | 'CHANGES_REQUESTED'> {
  const latest = new Map<string, { timestamp: number; state?: 'APPROVED' | 'CHANGES_REQUESTED' }>();
  for (const review of reviews) {
    const author = normalizeOptionalString(review.author?.login);
    const state = normalizeOptionalString(review.state)?.toUpperCase();
    if (
      author === undefined
      || (state !== 'APPROVED' && state !== 'CHANGES_REQUESTED' && state !== 'DISMISSED')
    ) {
      continue;
    }
    const timestamp = parseTimestamp(review.submittedAt);
    const previous = latest.get(author);
    if (previous === undefined || timestamp >= previous.timestamp) {
      latest.set(author, { timestamp, state: state === 'DISMISSED' ? undefined : state });
    }
  }
  return new Map(
    [...latest.entries()]
      .filter(([, value]) => value.state !== undefined)
      .map(([author, value]) => [author, value.state!]),
  );
}

function analyzeBotSignals(reviews: GhReview[], comments: GhComment[], checks: GhCheckRun[]): {
  state: BotReviewState;
  source: string;
  cooldownMessage?: string;
} {
  const botReviews: BotReviewSignal[] = [];
  for (const review of reviews) {
    const source = normalizeOptionalString(review.author?.login);
    if (source === undefined || !isBotLogin(source)) {
      continue;
    }
    botReviews.push({
      source,
      state: normalizeOptionalString(review.state)?.toUpperCase(),
      body: normalizeOptionalString(review.body),
      timestamp: parseTimestamp(review.submittedAt),
    });
  }

  const botComments: TimedSignal[] = [];
  for (const comment of comments) {
    const source = normalizeOptionalString(comment.author?.login);
    if (source === undefined || !isBotLogin(source)) {
      continue;
    }
    botComments.push({
      source,
      body: normalizeOptionalString(comment.body),
      timestamp: Math.max(parseTimestamp(comment.createdAt), parseTimestamp(comment.updatedAt)),
    });
  }

  const botChecks: BotCheckSignal[] = [];
  for (const check of checks) {
    const source = normalizeOptionalString(check.context) ?? normalizeOptionalString(check.name);
    if (source === undefined || !isBotCheck(source)) {
      continue;
    }
    botChecks.push({
      source,
      status: normalizeCheckStatus(check),
      timestamp: Math.max(parseTimestamp(check.startedAt), parseTimestamp(check.completedAt)),
    });
  }

  const latestBotComment = latestTimedSignal(botComments);
  const latestBotReview = latestTimedSignal(botReviews);
  const latestBotCheck = latestTimedSignal(botChecks);
  const latestSignal = latestTimedSignal([...botComments, ...botReviews, ...botChecks]);
  const cooldownMessage = latestSignal?.body === undefined ? undefined : extractCooldownMessage(latestSignal.body);
  const latestHumanMeaningfulTimestamp = Math.max(latestBotReview?.timestamp ?? 0, latestBotComment?.timestamp ?? 0);

  if (cooldownMessage !== undefined) {
    return {
      state: 'commented',
      source: latestSignal?.source ?? 'bot',
      cooldownMessage,
    };
  }

  if (latestBotCheck !== undefined && isPendingBotStatus(latestBotCheck.status) && latestBotCheck.timestamp >= latestHumanMeaningfulTimestamp) {
    return { state: 'pending', source: latestBotCheck.source };
  }

  if (latestBotReview?.state === 'APPROVED') {
    return { state: 'approved', source: latestBotReview.source };
  }
  if (latestBotReview?.state === 'CHANGES_REQUESTED') {
    return { state: 'changes_requested', source: latestBotReview.source };
  }
  if (latestBotCheck !== undefined && isSuccessfulBotStatus(latestBotCheck.status) && latestBotCheck.timestamp >= latestHumanMeaningfulTimestamp) {
    return { state: 'approved', source: latestBotCheck.source };
  }
  if (latestSignal !== undefined) {
    return { state: 'commented', source: latestSignal.source };
  }
  return { state: 'none', source: 'bot' };
}

function latestTimedSignal<T extends TimedSignal>(signals: T[]): T | undefined {
  return [...signals].sort((left, right) => right.timestamp - left.timestamp)[0];
}

function isPendingBotStatus(status: string): boolean {
  return ['PENDING', 'IN_PROGRESS', 'QUEUED', 'EXPECTED', 'WAITING', 'REQUESTED'].includes(status);
}

function isSuccessfulBotStatus(status: string): boolean {
  return ['SUCCESS', 'COMPLETED', 'NEUTRAL', 'SKIPPED'].includes(status);
}

function extractCooldownMessage(body: string): string | undefined {
  if (!/rate limit exceeded/iu.test(body)) {
    return undefined;
  }
  const waitMatch = /please wait \*\*(.+?)\*\* before requesting another review/iu.exec(body);
  if (waitMatch?.[1] !== undefined) {
    return `Review cooldown active: wait ${waitMatch[1]} before requesting another review.`;
  }
  return 'Review cooldown active due to an explicit bot rate-limit message.';
}

function displayBotSource(source: string): string {
  if (source.toLowerCase() === 'coderabbitai' || source.toLowerCase() === 'coderabbit') {
    return 'CodeRabbit';
  }
  return source;
}

function isBotLogin(login: string | null | undefined): boolean {
  if (login === undefined || login === null) {
    return false;
  }
  return login === 'coderabbitai' || /\[bot\]$/iu.test(login) || /\bbot\b/iu.test(login);
}

function isBotCheck(name: string): boolean {
  return /coderabbit/iu.test(name) || /\bbot\b/iu.test(name);
}

function normalizeReviewDecision(value: string | null | undefined): ReviewDecision {
  const candidate = normalizeOptionalString(value)?.toUpperCase();
  if (candidate === 'APPROVED' || candidate === 'CHANGES_REQUESTED' || candidate === 'REVIEW_REQUIRED') {
    return candidate;
  }
  return 'NONE';
}

function normalizeOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const normalized = value.trim();
  return normalized.length === 0 ? undefined : normalized;
}

function parseTimestamp(value: string | null | undefined): number {
  const normalized = normalizeOptionalString(value);
  if (normalized === undefined) {
    return 0;
  }
  const parsed = Date.parse(normalized);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function requirePositiveInteger(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new Error(`${label} must be a positive integer.`);
  }
  return value;
}
