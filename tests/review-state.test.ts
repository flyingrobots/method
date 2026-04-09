import { describe, expect, it } from 'vitest';
import { queryReviewState, type ReviewStateClient } from '../src/review-state.js';

describe('review-state engine', () => {
  it('returns a deterministic no-pr result when the current branch has no open PR', async () => {
    const client = createClient({
      gitBranch: 'cycles/0034-review-state-query',
      prList: [],
    });

    const result = await queryReviewState({
      cwd: '/tmp/method',
      client,
    });

    expect(result.status).toBe('no-pr');
    expect(result.pr_number).toBeNull();
    expect(result.merge_ready).toBe(false);
    expect(result.blockers).toEqual([
      {
        type: 'selection',
        message: 'No PR found for current branch: cycles/0034-review-state-query.',
        source: 'github',
      },
    ]);
  });

  it('returns an ambiguous-pr result when multiple PRs match the current branch', async () => {
    const client = createClient({
      gitBranch: 'feature/review-state',
      prList: [{ number: 17, url: 'https://example.test/pr/17' }, { number: 18, url: 'https://example.test/pr/18' }],
    });

    const result = await queryReviewState({
      cwd: '/tmp/method',
      client,
    });

    expect(result.status).toBe('ambiguous-pr');
    expect(result.blockers[0]).toEqual({
      type: 'selection',
      message: 'Multiple PRs match current branch (feature/review-state); rerun with --pr <number>.',
      source: 'github',
    });
  });

  it('rejects currentBranch:false when no explicit PR is provided', async () => {
    const client = createClient({});

    await expect(queryReviewState({
      cwd: '/tmp/method',
      currentBranch: false,
      client,
    })).rejects.toThrow('review-state requires either --pr or --current-branch');
  });

  it('treats unresolved threads as the live blockers and suppresses stale CHANGES_REQUESTED duplication', async () => {
    const client = createClient({
      gitBranch: 'feature/review-state',
      prList: [{ number: 18, url: 'https://example.test/pr/18' }],
      prView: {
        number: 18,
        url: 'https://example.test/pr/18',
        reviewDecision: 'CHANGES_REQUESTED',
        statusCheckRollup: [],
        reviews: [
          { author: { login: 'reviewer-one' }, state: 'CHANGES_REQUESTED', submittedAt: '2026-04-09T07:00:00Z' },
        ],
        comments: [],
      },
      unresolvedThreads: [
        { isResolved: false, isOutdated: false },
        { isResolved: true, isOutdated: false },
      ],
    });

    const result = await queryReviewState({
      cwd: '/tmp/method',
      client,
    });

    expect(result.status).toBe('blocked');
    expect(result.unresolved_thread_count).toBe(1);
    expect(result.changes_requested_count).toBe(1);
    expect(result.blockers).toContainEqual({
      type: 'unresolved_threads',
      message: '1 unresolved review thread.',
      source: 'github',
    });
    expect(result.blockers.some((blocker) => blocker.type === 'review_decision')).toBe(false);
  });

  it('reports pending bot review when a bot status check is newer than earlier blocking reviews', async () => {
    const client = createClient({
      prView: {
        number: 21,
        url: 'https://example.test/pr/21',
        reviewDecision: 'APPROVED',
        statusCheckRollup: [
          {
            __typename: 'CheckRun',
            workflowName: 'CI',
            name: 'test',
            status: 'COMPLETED',
            conclusion: 'SUCCESS',
            detailsUrl: 'https://example.test/checks/test',
          },
          {
            __typename: 'StatusContext',
            context: 'CodeRabbit',
            state: 'PENDING',
            targetUrl: 'https://example.test/checks/coderabbit',
            startedAt: '2026-04-09T07:30:00Z',
          },
        ],
        reviews: [
          { author: { login: 'reviewer-one' }, state: 'APPROVED', submittedAt: '2026-04-09T07:15:00Z' },
          { author: { login: 'coderabbitai' }, state: 'CHANGES_REQUESTED', submittedAt: '2026-04-09T07:00:00Z' },
        ],
        comments: [],
      },
      unresolvedThreads: [],
    });

    const result = await queryReviewState({
      cwd: '/tmp/method',
      pr: 21,
      client,
    });

    expect(result.bot_review_state).toBe('pending');
    expect(result.blockers).toContainEqual({
      type: 'bot_review',
      message: 'CodeRabbit review in progress.',
      source: 'CodeRabbit',
    });
    expect(result.blockers).toContainEqual({
      type: 'pending_checks',
      message: '1 pending check.',
      source: 'github',
    });
  });

  it('detects explicit bot cooldown messages from the latest bot signal', async () => {
    const client = createClient({
      prView: {
        number: 22,
        url: 'https://example.test/pr/22',
        reviewDecision: 'APPROVED',
        statusCheckRollup: [],
        reviews: [
          { author: { login: 'reviewer-one' }, state: 'APPROVED', submittedAt: '2026-04-09T07:15:00Z' },
        ],
        comments: [
          {
            author: { login: 'coderabbitai' },
            createdAt: '2026-04-09T07:31:00Z',
            body: [
              '## Rate limit exceeded',
              '',
              'Please wait **14 minutes and 30 seconds** before requesting another review.',
            ].join('\n'),
          },
        ],
      },
      unresolvedThreads: [],
    });

    const result = await queryReviewState({
      cwd: '/tmp/method',
      pr: 22,
      client,
    });

    expect(result.bot_review_state).toBe('commented');
    expect(result.blockers).toContainEqual({
      type: 'policy_cooldown',
      message: 'Review cooldown active: wait 14 minutes and 30 seconds before requesting another review.',
      source: 'coderabbitai',
    });
  });

  it('returns ready when checks pass, threads are resolved, and no reviewer or bot is blocking', async () => {
    const client = createClient({
      prView: {
        number: 23,
        url: 'https://example.test/pr/23',
        reviewDecision: 'APPROVED',
        statusCheckRollup: [
          {
            __typename: 'CheckRun',
            workflowName: 'CI',
            name: 'test',
            status: 'COMPLETED',
            conclusion: 'SUCCESS',
            detailsUrl: 'https://example.test/checks/test',
          },
          {
            __typename: 'StatusContext',
            context: 'CodeRabbit',
            state: 'SUCCESS',
            targetUrl: 'https://example.test/checks/coderabbit',
            startedAt: '2026-04-09T07:33:00Z',
          },
        ],
        reviews: [
          { author: { login: 'reviewer-one' }, state: 'APPROVED', submittedAt: '2026-04-09T07:20:00Z' },
        ],
        comments: [],
      },
      unresolvedThreads: [],
    });

    const result = await queryReviewState({
      cwd: '/tmp/method',
      pr: 23,
      client,
    });

    expect(result.status).toBe('ready');
    expect(result.merge_ready).toBe(true);
    expect(result.bot_review_state).toBe('approved');
    expect(result.approval_count).toBe(1);
    expect(result.blockers).toEqual([]);
  });

  it('treats unknown check states as blocking instead of silently counting them as passing', async () => {
    const client = createClient({
      prView: {
        number: 25,
        url: 'https://example.test/pr/25',
        reviewDecision: 'APPROVED',
        statusCheckRollup: [
          {
            __typename: 'StatusContext',
            context: 'mystery-check',
            state: 'UNKNOWN',
            targetUrl: 'https://example.test/checks/mystery',
            startedAt: '2026-04-09T07:33:00Z',
          },
        ],
        reviews: [
          { author: { login: 'reviewer-one' }, state: 'APPROVED', submittedAt: '2026-04-09T07:20:00Z' },
        ],
        comments: [],
      },
      unresolvedThreads: [],
    });

    const result = await queryReviewState({
      cwd: '/tmp/method',
      pr: 25,
      client,
    });

    expect(result.status).toBe('blocked');
    expect(result.merge_ready).toBe(false);
    expect(result.checks.passing).toEqual([]);
    expect(result.checks.pending).toEqual([
      {
        name: 'mystery-check',
        status: 'UNKNOWN',
        url: 'https://example.test/checks/mystery',
      },
    ]);
    expect(result.blockers).toContainEqual({
      type: 'pending_checks',
      message: '1 pending check.',
      source: 'github',
    });
  });

  it('clears an earlier decisive vote when the same reviewer later dismisses it', async () => {
    const client = createClient({
      prView: {
        number: 24,
        url: 'https://example.test/pr/24',
        reviewDecision: 'NONE',
        statusCheckRollup: [],
        reviews: [
          { author: { login: 'reviewer-one' }, state: 'APPROVED', submittedAt: '2026-04-09T07:10:00Z' },
          { author: { login: 'reviewer-one' }, state: 'DISMISSED', submittedAt: '2026-04-09T07:20:00Z' },
        ],
        comments: [],
      },
      unresolvedThreads: [],
    });

    const result = await queryReviewState({
      cwd: '/tmp/method',
      pr: 24,
      client,
    });

    expect(result.approval_count).toBe(0);
    expect(result.changes_requested_count).toBe(0);
  });
});

function createClient(options: {
  gitBranch?: string;
  prList?: Array<{ number: number; url: string }>;
  prView?: Record<string, unknown>;
  unresolvedThreads?: Array<{ isResolved: boolean; isOutdated: boolean }>;
}): ReviewStateClient {
  return {
    async ghJson<T>(_cwd: string, args: readonly string[]): Promise<T> {
      if (args[0] === 'pr' && args[1] === 'list') {
        return (options.prList ?? []) as T;
      }
      if (args[0] === 'repo' && args[1] === 'view') {
        return {
          owner: { login: 'flyingrobots' },
          name: 'method',
        } as T;
      }
      if (args[0] === 'pr' && args[1] === 'view') {
        return (options.prView ?? {
          number: 999,
          url: 'https://example.test/pr/999',
          reviewDecision: 'NONE',
          statusCheckRollup: [],
          reviews: [],
          comments: [],
        }) as T;
      }
      if (args[0] === 'api' && args[1] === 'graphql') {
        return {
          data: {
            repository: {
              pullRequest: {
                reviewThreads: {
                  pageInfo: {
                    hasNextPage: false,
                    endCursor: null,
                  },
                  nodes: options.unresolvedThreads ?? [],
                },
              },
            },
          },
        } as T;
      }
      throw new Error(`Unexpected gh call: ${args.join(' ')}`);
    },
    async gitText(_cwd: string, args: readonly string[]): Promise<string> {
      if (args.join(' ') === 'rev-parse --abbrev-ref HEAD') {
        return `${options.gitBranch ?? 'main'}\n`;
      }
      throw new Error(`Unexpected git call: ${args.join(' ')}`);
    },
  };
}
