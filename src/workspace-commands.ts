import { execFile } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { promisify } from 'node:util';

export const PROCESS_SCAFFOLD = [
  '# Process',
  '',
  'METHOD is a lightweight workflow for turning raw ideas into shaped,',
  'verified, and reviewable changes. Capture work explicitly, move it',
  'through the backlog on purpose, and close cycles with evidence.',
  '',
  '## Task Lifecycle',
  '',
  '```mermaid',
  'sequenceDiagram',
  '  actor Requester as Request or idea source',
  '  participant Operator as Human or LLM operator',
  '  participant Backlog as METHOD backlog',
  '  participant Cycle as Active cycle',
  '  participant Repo as Repo artifacts',
  '  Requester->>Operator: Bring a request or idea',
  '  Operator->>Backlog: Capture item in inbox',
  '  Note over Backlog: Triage into asap, bad-code, cool-ideas, or a release lane',
  '  Operator->>Backlog: Shape and prioritize the work',
  '  Operator->>Cycle: Pull one bounded item into a cycle',
  '  Cycle->>Repo: Create design doc and playback questions',
  '  Operator->>Repo: Implement the change and update tests',
  '  Operator->>Repo: Run drift and capture witness',
  '  Operator->>Repo: Write retro and close cycle',
  '  Repo-->>Requester: Ship sync leaves traceable artifacts',
  '```',
  '',
  '## How METHOD Works',
  '',
  '- Capture raw ideas before acting on them.',
  '- Triage backlog items into the right lane instead of treating every task as urgent.',
  '- Pull one bounded item into an active cycle with a design doc.',
  '- Use playback questions to define the behavior that must be proven.',
  '- Implement the change, update tests, and run drift so the design and tests still agree.',
  '- Close the cycle with a witness and retro so future readers can inspect what actually happened.',
  '',
  '## Working With an LLM',
  '',
  '- Ask the LLM to read status, inspect backlog lanes, and summarize the current repo posture before changing files.',
  '- Have the LLM capture or move backlog items rather than keeping work in chat only.',
  '- Use the LLM to draft or refine the design doc, but keep the playback questions concrete and testable.',
  '- Let the LLM implement code and run validation, then review the witness and retro before treating the cycle as done.',
  '- Require the LLM to anchor strong claims to files, commands, tests, or generated artifacts in the repo.',
  '',
  '## Working By Hand',
  '',
  '- Capture the task in the backlog first, even if you already know how to solve it.',
  '- Pull one cycle at a time and keep the design doc honest as the plan changes.',
  '- Write or update tests from the playback questions, not from vague intent.',
  '- Run the relevant validation before closing the cycle.',
  '- Write a retro that explains what shipped, what evidence exists, and what follow-up work remains.',
  '',
].join('\n');

export interface CommandExecutionResult {
  command: string;
  output: string;
  ok: boolean;
  timedOut: boolean;
}

export async function runWorkspaceCommand(
  root: string,
  command: string,
  args: string[] = [],
  options?: { timeoutMs?: number },
): Promise<CommandExecutionResult> {
  const fullCommand = [command, ...args].join(' ');
  if (process.env.METHOD_TEST === 'true') {
    return {
      command: fullCommand,
      output: `[MOCK] Output for ${fullCommand}`,
      ok: true,
      timedOut: false,
    };
  }

  const execFileAsync = promisify(execFile);
  try {
    const { stdout, stderr } = await execFileAsync(command, args, {
      cwd: root,
      encoding: 'utf8',
      timeout: options?.timeoutMs,
    });
    return {
      command: fullCommand,
      output: stdout + stderr,
      ok: true,
      timedOut: false,
    };
  } catch (error: unknown) {
    const execError = error as { killed?: boolean; signal?: string; stdout?: string; stderr?: string };
    if (execError.killed || execError.signal === 'SIGTERM') {
      return {
        command: fullCommand,
        output: `Command timed out: ${fullCommand}`,
        ok: false,
        timedOut: true,
      };
    }
    const message = error instanceof Error ? error.message : String(error);
    const output =
      `${execError.stdout ?? ''}${execError.stderr ?? ''}`.trim().length > 0
        ? `${execError.stdout ?? ''}${execError.stderr ?? ''}`
        : message;
    return {
      command: fullCommand,
      output,
      ok: false,
      timedOut: false,
    };
  }
}

export function resolveWitnessTestCommand(root: string): { command: string; args: string[] } | undefined {
  const packageJsonPath = resolve(root, 'package.json');
  if (!existsSync(packageJsonPath)) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
      scripts?: Record<string, unknown>;
    };
    if (typeof parsed.scripts?.test === 'string' && parsed.scripts.test.trim().length > 0) {
      return { command: 'npm', args: ['test'] };
    }
  } catch {
    return undefined;
  }

  return undefined;
}
