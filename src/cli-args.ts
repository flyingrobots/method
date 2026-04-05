import { type Outcome } from './domain.js';
import { MethodError } from './errors.js';

export type ParsedCommand =
  | { command: 'help'; topic?: string }
  | { command: 'init'; path: string }
  | { command: 'inbox'; idea: string; legend?: string; title?: string }
  | { command: 'pull'; item: string }
  | { command: 'close'; cycle?: string; driftCheck?: 'yes' | 'no'; outcome?: Outcome }
  | { command: 'drift'; cycle?: string }
  | { command: 'status' }
  | { command: 'mcp' }
  | { command: 'sync'; adapter: 'github'; push?: boolean; pull?: boolean }
  | { command: 'sync'; adapter: 'ship' };

export function parseCliArgs(argv: readonly string[]): ParsedCommand {
  const [command, ...rest] = argv;
  if (command === undefined || command === '--help' || command === '-h') {
    return { command: 'help' };
  }

  if (command === 'help') {
    if (rest.length > 1) {
      throw new MethodError('Usage: method help [command]');
    }
    return { command: 'help', topic: rest[0] };
  }

  if (rest.includes('--help') || rest.includes('-h')) {
    return { command: 'help', topic: command };
  }

  switch (command) {
    case 'init':
      return parseInitArgs(rest);
    case 'inbox':
      return parseInboxArgs(rest);
    case 'pull':
      return parsePullArgs(rest);
    case 'close':
      return parseCloseArgs(rest);
    case 'drift':
      return parseDriftArgs(rest);
    case 'status':
      if (rest.length > 0) {
        throw new MethodError('`status` does not take any arguments.');
      }
      return { command: 'status' };
    case 'mcp':
      if (rest.length > 0) {
        throw new MethodError('`mcp` does not take any arguments.');
      }
      return { command: 'mcp' };
    case 'sync':
      if (rest[0] === 'github') {
        const push = rest.includes('--push');
        const pull = rest.includes('--pull');
        const finalPush = push || (!push && !pull);
        return { command: 'sync', adapter: 'github', push: finalPush, pull };
      }
      if (rest[0] === 'ship') {
        return { command: 'sync', adapter: 'ship' };
      }
      throw new MethodError('Usage: method sync github|ship');
    default:
      throw new MethodError(`Unknown command: ${command}`);
  }
}

export function usage(topic?: string): string {
  if (topic === 'init') {
    return 'Usage: method init [path]\n\nScaffold a METHOD workspace in the given directory.';
  }
  if (topic === 'inbox') {
    return 'Usage: method inbox <idea> [--legend CODE] [--title TITLE]\n\nCapture a raw idea in docs/method/backlog/inbox/.';
  }
  if (topic === 'pull') {
    return 'Usage: method pull <item>\n\nPromote a backlog item into the next numbered design cycle.';
  }
  if (topic === 'close') {
    return 'Usage: method close [cycle] [--drift-check yes|no] [--outcome hill-met|partial|not-met]\n\nClose an active cycle into docs/method/retro/.';
  }
  if (topic === 'status') {
    return 'Usage: method status\n\nShow backlog lanes, active cycles, and legend health.';
  }
  if (topic === 'drift') {
    return [
      'Usage: method drift [cycle]',
      '',
      'Check active cycle playback questions against test descriptions in tests/.',
      'First cut scans tests/**/*.test.* and tests/**/*.spec.* only.',
    ].join('\n');
  }

  if (topic === 'mcp') {
    return 'Usage: method mcp\n\nStart an MCP (Model Context Protocol) server on stdio.';
  }

  if (topic === 'sync') {
    return [
      'Usage: method sync github|ship [options]',
      '',
      'GitHub Options:',
      '  --push                      Update GitHub issues with local changes (default).',
      '  --pull                      Update local backlog with GitHub changes (labels, comments, status).',
      '',
      'Perform Ship Sync or synchronize the backlog with GitHub Issues.',
    ].join('\n');
  }

  return [
    'Usage: method <command> [options]',
    '',
    'Commands:',
    '  init [path]                 Scaffold a METHOD workspace.',
    '  inbox <idea>                Capture a raw idea in inbox/.',
    '  pull <item>                 Promote a backlog item into a cycle.',
    '  close [cycle]               Write a retro for an active cycle.',
    '  drift [cycle]               Check active cycle playback questions against tests.',
    '  status                      Show backlog, active cycles, and legend health.',
    '  mcp                         Start the MCP server over stdio.',
    '  sync github [--push|--pull] Sync backlog with GitHub Issues.',
    '  sync ship                   Perform Ship Sync.',
    '',
    'Run `method help <command>` for command-specific usage.',
  ].join('\n');
}

function parseInitArgs(args: readonly string[]): ParsedCommand {
  if (args.length > 1) {
    throw new MethodError('Usage: method init [path]');
  }
  return { command: 'init', path: args[0] ?? '.' };
}

function parseInboxArgs(args: readonly string[]): ParsedCommand {
  let legend: string | undefined;
  let title: string | undefined;
  const positionals: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value === '--legend') {
      legend = requireOptionValue(args, index, '--legend');
      index += 1;
      continue;
    }
    if (value.startsWith('--legend=')) {
      legend = value.slice('--legend='.length);
      continue;
    }
    if (value === '--title') {
      title = requireOptionValue(args, index, '--title');
      index += 1;
      continue;
    }
    if (value.startsWith('--title=')) {
      title = value.slice('--title='.length);
      continue;
    }
    if (value.startsWith('-')) {
      throw new MethodError(`Unknown option: ${value}`);
    }
    positionals.push(value);
  }

  if (positionals.length !== 1) {
    throw new MethodError('Usage: method inbox <idea> [--legend CODE] [--title TITLE]');
  }

  return { command: 'inbox', idea: positionals[0], legend, title };
}

function parsePullArgs(args: readonly string[]): ParsedCommand {
  if (args.length !== 1) {
    throw new MethodError('Usage: method pull <item>');
  }
  return { command: 'pull', item: args[0] };
}

function parseCloseArgs(args: readonly string[]): ParsedCommand {
  let cycle: string | undefined;
  let driftCheck: 'yes' | 'no' | undefined;
  let outcome: Outcome | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value === '--drift-check') {
      driftCheck = parseDriftCheckValue(requireOptionValue(args, index, '--drift-check'));
      index += 1;
      continue;
    }
    if (value.startsWith('--drift-check=')) {
      driftCheck = parseDriftCheckValue(value.slice('--drift-check='.length));
      continue;
    }
    if (value === '--outcome') {
      outcome = parseOutcomeValue(requireOptionValue(args, index, '--outcome'));
      index += 1;
      continue;
    }
    if (value.startsWith('--outcome=')) {
      outcome = parseOutcomeValue(value.slice('--outcome='.length));
      continue;
    }
    if (value.startsWith('-')) {
      throw new MethodError(`Unknown option: ${value}`);
    }
    if (cycle !== undefined) {
      throw new MethodError('Usage: method close [cycle] [--drift-check yes|no] [--outcome hill-met|partial|not-met]');
    }
    cycle = value;
  }

  return { command: 'close', cycle, driftCheck, outcome };
}

function parseDriftArgs(args: readonly string[]): ParsedCommand {
  if (args.length > 1) {
    throw new MethodError('Usage: method drift [cycle]');
  }
  return { command: 'drift', cycle: args[0] };
}

function requireOptionValue(args: readonly string[], index: number, optionName: string): string {
  const value = args[index + 1];
  if (value === undefined || value.startsWith('-')) {
    throw new MethodError(`${optionName} requires a value.`);
  }
  return value;
}

function parseDriftCheckValue(value: string): 'yes' | 'no' {
  if (value === 'yes' || value === 'no') {
    return value;
  }
  throw new MethodError('`--drift-check` must be `yes` or `no`.');
}

function parseOutcomeValue(value: string): Outcome {
  if (value === 'hill-met' || value === 'partial' || value === 'not-met') {
    return value;
  }
  throw new MethodError('`--outcome` must be `hill-met`, `partial`, or `not-met`.');
}
