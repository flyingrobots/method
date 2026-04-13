import { promisify } from 'node:util';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('review-state exec client', () => {
  afterEach(() => {
    vi.doUnmock('node:child_process');
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('passes a larger maxBuffer to gh and git subprocesses used by the default query path', async () => {
    vi.resetModules();
    const calls: Array<{ command: string; args: string[]; options: Record<string, unknown> }> = [];
    const resolveCommand = (command: string, args: string[], options: Record<string, unknown>): { stdout: string; stderr: string } => {
      calls.push({ command, args: [...args], options });

      if (command === 'git' && args.join(' ') === 'rev-parse --abbrev-ref HEAD') {
        return { stdout: 'cycles/0034-review-state-query\n', stderr: '' };
      }

      if (command === 'gh' && args[0] === 'pr' && args[1] === 'list') {
        return { stdout: JSON.stringify([{ number: 19, url: 'https://example.test/pr/19' }]), stderr: '' };
      }

      if (command === 'gh' && args[0] === 'repo' && args[1] === 'view') {
        return { stdout: JSON.stringify({ owner: { login: 'flyingrobots' }, name: 'method' }), stderr: '' };
      }

      if (command === 'gh' && args[0] === 'pr' && args[1] === 'view') {
        return {
          stdout: JSON.stringify({
            number: 19,
            url: 'https://example.test/pr/19',
            reviewDecision: 'APPROVED',
            statusCheckRollup: [],
            reviews: [],
            comments: [],
          }),
          stderr: '',
        };
      }

      if (command === 'gh' && args[0] === 'api' && args[1] === 'graphql') {
        return {
          stdout: JSON.stringify({
            data: {
              repository: {
                pullRequest: {
                  reviewThreads: {
                    pageInfo: {
                      hasNextPage: false,
                      endCursor: null,
                    },
                    nodes: [],
                  },
                },
              },
            },
          }),
          stderr: '',
        };
      }

      throw new Error(`Unexpected command: ${command} ${args.join(' ')}`);
    };
    const execFileMock = vi.fn(
      (
        command: string,
        args: string[],
        options: Record<string, unknown>,
        callback: (error: Error | null, stdout?: string, stderr?: string) => void,
      ) => {
        try {
          const result = resolveCommand(command, args, options);
          callback(null, result.stdout, result.stderr);
        } catch (error) {
          callback(error as Error);
        }
      },
    );
    execFileMock[promisify.custom] = (command: string, args: string[], options: Record<string, unknown>) =>
      Promise.resolve(resolveCommand(command, args, options));

    vi.doMock('node:child_process', () => ({
      execFile: execFileMock,
    }));

    const { queryReviewState } = await import('../src/review-state.js');

    const result = await queryReviewState({ cwd: '/tmp/method' });

    expect(result.status).toBe('ready');
    expect(calls.length).toBeGreaterThan(0);
    for (const call of calls) {
      expect(call.options.maxBuffer).toBe(10 * 1024 * 1024);
      expect(call.options.timeout).toBe(30_000);
    }
  });
});
